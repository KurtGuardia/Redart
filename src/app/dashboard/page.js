'use client'

import { useState, useEffect } from 'react'
import {
  auth,
  db,
  storage,
} from '../../lib/firebase-client'
import {
  Timestamp,
  doc,
  updateDoc,
  GeoPoint,
} from 'firebase/firestore'
import {
  getDownloadURL,
  ref,
  uploadBytes,
  deleteObject,
} from 'firebase/storage'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useVenueData } from '../../hooks/useVenueData'
import Spot from '../../components/Spot'
import EditModal from '../../components/EditModal'

const MapComponent = dynamic(
  () => import('../../components/MapComponent'),
  {
    ssr: false,
  },
)

// Available amenities options
const AMENITIES_OPTIONS = [
  'Parking',
  'Bar',
  'Escenario',
  'Snacks',
  'Comida',
  'Acceso discapacitados',
  'Wi-Fi',
]

export default function Dashboard() {
  const [eventTitle, setEventTitle] = useState('')
  const [eventDate, setEventDate] = useState('')
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState([])
  const [venueId, setVenueId] = useState(null)
  const [isEditModalOpen, setIsEditModalOpen] =
    useState(false)
  const [isEventEditModalOpen, setIsEventEditModalOpen] =
    useState(false)
  const [currentEvent, setCurrentEvent] = useState(null)
  const {
    venue,
    loading: venueLoading,
    error: venueError,
    refreshVenue,
  } = useVenueData(venueId)

  // Helper function to upload new photos to Firebase Storage
  const uploadPhotos = async (photos, venueId) => {
    if (!photos || photos.length === 0) return []

    const urls = []

    // First add all existing photo URLs (strings)
    for (const photo of photos) {
      if (typeof photo === 'string') {
        urls.push(photo)
      }
    }

    // Then upload any new photos (File objects)
    for (const photo of photos) {
      if (typeof photo !== 'string') {
        try {
          // Add timestamp to filename to avoid cache issues
          const timestamp = new Date().getTime()
          const fileName = `${timestamp}_${photo.name}`
          const storageRef = ref(
            storage,
            `venues/${venueId}/photos/${fileName}`,
          )

          await uploadBytes(storageRef, photo)
          const url = await getDownloadURL(storageRef)
          urls.push(url)
        } catch (error) {
          console.error('Error uploading photo:', error)
        }
      }
    }

    return urls
  }

  // Helper function to delete a photo from Firebase Storage
  const deletePhoto = async (photoUrl) => {
    if (!photoUrl) return
    try {
      // Extract the path from the URL
      const urlParts = photoUrl.split('?')[0].split('/')
      const fileName = urlParts[urlParts.length - 1]
      const filePath = `venues/${venueId}/photos/${fileName}`
      const photoRef = ref(storage, filePath)

      // Delete the file
      await deleteObject(photoRef)
    } catch (error) {
      console.error('Error deleting photo:', error)
    }
  }

  const handleAddEvent = async (e) => {
    e.preventDefault()

    const newEventData = {
      title: eventTitle,
      date: Timestamp.fromDate(new Date(eventDate)),
      venueId: venueId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }

    try {
      const eventId = await addEvent(newEventData)
      console.log('Event added with ID:', eventId)
      setEvents([
        ...events,
        { id: eventId, ...newEventData },
      ])
      setEventTitle('')
      setEventDate('')
    } catch (error) {
      console.error('Error adding event:', error)
    }
  }

  const handleEditVenue = async (updatedData) => {
    try {
      setLoading(true)
      const venueRef = doc(db, 'venues', venueId)

      // Extract location and photos from updated data
      const {
        location,
        photos: updatedPhotos,
        ...otherData
      } = updatedData

      // Create a copy of the formatted data without photos first
      const formattedData = {
        ...otherData,
        updatedAt: Timestamp.now(),
      }

      // Handle location updates - only create a GeoPoint if valid lat/lng values exist
      if (
        location &&
        typeof location.lat === 'number' &&
        typeof location.lng === 'number'
      ) {
        formattedData.location = new GeoPoint(
          location.lat,
          location.lng,
        )
      } else if (!location && venue.location) {
        // If no new location provided but venue has a location, preserve the existing location
        formattedData.location = venue.location
      }

      // Process photos separately if they were modified
      if (updatedPhotos) {
        try {
          // Process deleted photos
          if (venue.photos) {
            const deletedPhotos = venue.photos.filter(
              (photoUrl) =>
                !updatedPhotos.some(
                  (photo) =>
                    typeof photo === 'string' &&
                    photo === photoUrl,
                ),
            )

            // Delete each removed photo from Storage
            for (const photoUrl of deletedPhotos) {
              await deletePhoto(photoUrl)
            }
          }

          // Upload any new photos and combine with retained existing photos
          const finalPhotoUrls = await uploadPhotos(
            updatedPhotos,
            venueId,
          )

          // Add the photos to the formatted data
          formattedData.photos = finalPhotoUrls
        } catch (error) {
          console.error('Error processing photos:', error)
        }
      }

      // Update the venue in Firestore
      await updateDoc(venueRef, formattedData)

      // First close the modal
      setIsEditModalOpen(false)

      // Then refresh the venue data after a short delay to ensure the modal is closed
      setTimeout(() => {
        if (refreshVenue) {
          refreshVenue()
        }
      }, 300)
    } catch (error) {
      console.error('Error updating venue:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEditEvent = async (updatedData) => {
    try {
      setLoading(true)

      // Format the date properly for Firestore
      const formattedData = {
        ...updatedData,
        date: updatedData.date
          ? Timestamp.fromDate(new Date(updatedData.date))
          : currentEvent.date,
        updatedAt: Timestamp.now(),
      }

      // Update the event in Firestore
      const eventRef = doc(db, 'events', currentEvent.id)
      await updateDoc(eventRef, formattedData)

      // Update the local state
      setEvents(
        events.map((event) =>
          event.id === currentEvent.id
            ? { ...event, ...formattedData }
            : event,
        ),
      )

      // Close the modal and reset current event
      setIsEventEditModalOpen(false)
      setCurrentEvent(null)
    } catch (error) {
      console.error('Error updating event:', error)
    } finally {
      setLoading(false)
    }
  }

  const venueFormFields = {
    name: {
      type: 'text',
      label: 'Nombre del espacio',
      required: true,
    },
    description: {
      type: 'textarea',
      label: 'Descripción',
      rows: 4,
      required: true,
    },
    address: {
      type: 'text',
      label: 'Dirección',
      required: true,
    },
    city: {
      type: 'text',
      label: 'Ciudad',
      required: true,
      show: false,
    },
    country: {
      type: 'text',
      label: 'País',
      required: true,
      show: false,
    },
    capacity: {
      type: 'number',
      label: 'Capacidad (personas)',
      required: true,
      min: 1,
    },
    email: {
      type: 'email',
      label: 'Email de contacto',
      required: true,
      show: false,
    },
    location: {
      type: 'map',
      label: 'Ubicación',
      description: 'Selecciona el punto exacto de entrada',
    },
    amenities: {
      type: 'checkboxGroup',
      label: 'Comodidades',
      options: AMENITIES_OPTIONS,
    },
    photos: {
      type: 'photoGallery',
      label: 'Fotos',
      description: 'Máximo 5 fotos',
      maxPhotos: 5,
    },
  }

  const eventFormFields = {
    title: {
      type: 'text',
      label: 'Título del evento',
      required: true,
    },
    date: {
      type: 'datetime-local',
      label: 'Fecha y hora',
      required: true,
    },
    description: {
      type: 'textarea',
      label: 'Descripción',
      rows: 3,
    },
  }

  const openEventEditModal = (event) => {
    // Format date from Timestamp to string for datetime-local input
    let formattedEvent = { ...event }

    if (event.date && event.date.seconds) {
      const date = new Date(event.date.seconds * 1000)
      // Format to YYYY-MM-DDThh:mm
      const formattedDate = date.toISOString().slice(0, 16)
      formattedEvent.date = formattedDate
    }

    setCurrentEvent(formattedEvent)
    setIsEventEditModalOpen(true)
  }

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(
      (currentVenue) => {
        if (currentVenue) {
          setVenueId(currentVenue.uid)
        }
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [])

  if (loading || venueLoading) {
    return <div>Loading...</div>
  }

  if (venueError) {
    return <div>Error: {venueError}</div>
  }

  return (
    <>
      <div className='relative container mx-auto px-4 py-8'>
        <Spot colorName={'red'} />
        <Spot colorName={'indigo'} />
        <Spot colorName={'peru'} />
        <div className='bg-gradient-to-r from-teal-500 to-blue-500 rounded-lg shadow-lg p-6 mb-8'>
          <h1 className='text-3xl font-bold text-white'>
            Bienvenido administrador de: {venue.name}
          </h1>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
          <div className='bg-white rounded-lg shadow-lg p-6'>
            <h2 className='text-2xl font-semibold mb-4 text-gray-800 flex items-center justify-between'>
              <div className='flex items-center'>
                <svg
                  className='w-6 h-6 mr-2'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'
                  />
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M15 11a3 3 0 11-6 0 3 3 0 016 0z'
                  />
                </svg>
                Mi espacio
              </div>
              <button
                className='text-teal-600 hover:text-teal-800'
                onClick={() => setIsEditModalOpen(true)}
              >
                <svg
                  className='w-5 h-5'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z'
                  />
                </svg>
              </button>
            </h2>

            {/* Logo and venue name */}
            {venue.logo && (
              <div className='flex items-center mb-4'>
                <div className='flex items-center'>
                  <img
                    src={venue.logo}
                    alt={`Logo de ${venue.name}`}
                    className='w-20 h-20 object-cover rounded-full border-2 border-teal-500 shadow-md mr-4'
                  />
                  <h3 className='text-xl font-bold text-gray-800'>
                    {venue.name}
                  </h3>
                </div>
              </div>
            )}

            {/* Map */}
            <div className='rounded-lg overflow-hidden mb-4 relative'>
              <MapComponent
                venues={[venue]}
                center={[
                  venue.location.latitude,
                  venue.location.longitude,
                ]}
                zoom={15}
                small={true}
                isDashboard={true}
              />
            </div>

            {/* Location info */}
            <div className='bg-gray-50 p-4 rounded-lg mb-4'>
              <h3 className='font-semibold text-gray-700 mb-2'>
                <span>Ubicación</span>
              </h3>
              <p className='text-sm text-gray-500 flex items-center gap-2 mb-2'>
                <svg
                  className='w-4 h-4'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'
                  />
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M15 11a3 3 0 11-6 0 3 3 0 016 0z'
                  />
                </svg>
                {venue.address}
              </p>
              {venue.city && venue.country && (
                <p className='text-sm text-gray-500 flex items-center gap-2'>
                  <svg
                    className='w-4 h-4'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <circle
                      cx='12'
                      cy='12'
                      r='10'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                    />
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z'
                    />
                  </svg>
                  {venue.city}, {venue.country}
                </p>
              )}
            </div>

            {/* Description */}
            <div className='bg-gray-50 p-4 rounded-lg mb-4'>
              <h3 className='font-semibold text-gray-700 mb-2'>
                <span>Descripción</span>
              </h3>
              <p className='text-sm text-gray-500 flex items-start gap-2'>
                <svg
                  className='w-4 h-4 mt-1 flex-shrink-0'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M4 4h16v16H4z'
                  />
                  <line
                    x1='8'
                    y1='8'
                    x2='16'
                    y2='8'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                  />
                  <line
                    x1='8'
                    y1='12'
                    x2='16'
                    y2='12'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                  />
                  <line
                    x1='8'
                    y1='16'
                    x2='12'
                    y2='16'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                  />
                </svg>
                <span>{venue.description}</span>
              </p>
            </div>

            {/* Capacity */}
            {venue.capacity && (
              <div className='bg-gray-50 p-4 rounded-lg mb-4'>
                <h3 className='font-semibold text-gray-700 mb-2'>
                  <span>Capacidad</span>
                </h3>
                <p className='text-sm text-gray-500 flex items-center gap-2'>
                  <svg
                    className='w-4 h-4'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
                    />
                  </svg>
                  {venue.capacity} personas
                </p>
              </div>
            )}

            {/* Amenities */}
            {venue.amenities &&
              venue.amenities.length > 0 && (
                <div className='bg-gray-50 p-4 rounded-lg mb-4'>
                  <h3 className='font-semibold text-gray-700 mb-2'>
                    <span>Comodidades</span>
                  </h3>
                  <div className='flex flex-wrap gap-2'>
                    {venue.amenities.map(
                      (amenity, index) => (
                        <span
                          key={index}
                          className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800'
                        >
                          <svg
                            className='w-3 h-3 mr-1'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M5 13l4 4L19 7'
                            />
                          </svg>
                          {amenity}
                        </span>
                      ),
                    )}
                  </div>
                </div>
              )}

            {/* Contact */}
            {venue.email && (
              <div className='bg-gray-50 p-4 rounded-lg mb-4'>
                <h3 className='font-semibold text-gray-700 mb-2'>
                  <span>Contacto</span>
                </h3>
                <p className='text-sm text-gray-500 flex items-center gap-2'>
                  <svg
                    className='w-4 h-4'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2z'
                    />
                  </svg>
                  {venue.email}
                </p>
              </div>
            )}

            {/* Photos gallery */}
            {venue.photos && venue.photos.length > 0 && (
              <div className='mt-4'>
                <h3 className='font-semibold text-gray-700 mb-2'>
                  <span>Fotos</span>
                </h3>
                <div className='flex flex-col gap-2'>
                  {/* First row - first 3 photos */}
                  <div className='grid grid-cols-3 gap-2'>
                    {venue.photos
                      .slice(0, 3)
                      .map((photo, index) => (
                        <img
                          key={index}
                          src={photo}
                          alt={`Foto ${index + 1} de ${
                            venue.name
                          }`}
                          className='w-full h-36 object-cover rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer'
                        />
                      ))}
                  </div>
                  {/* Second row - next 2 photos */}
                  {venue.photos.length > 3 && (
                    <div className='grid grid-cols-2 gap-2 m-auto'>
                      {venue.photos
                        .slice(3, 5)
                        .map((photo, index) => (
                          <img
                            key={index + 3}
                            src={photo}
                            alt={`Foto ${index + 4} de ${
                              venue.name
                            }`}
                            className='w-full h-36 object-cover rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer'
                          />
                        ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className='bg-white rounded-lg shadow-lg p-6'>
            <h2 className='text-2xl font-semibold mb-4 text-gray-800 flex items-center'>
              <svg
                className='w-6 h-6 mr-2'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
                />
              </svg>
              Mis eventos
            </h2>
            <form
              onSubmit={handleAddEvent}
              className='space-y-4 mt-6 bg-gray-50 p-4 rounded-lg'
            >
              <div>
                <label
                  htmlFor='eventTitle'
                  className='block text-sm font-medium text-gray-700 mb-1'
                >
                  Título del evento
                </label>
                <input
                  id='eventTitle'
                  type='text'
                  placeholder='Ej: Concierto de Jazz'
                  value={eventTitle}
                  onChange={(e) =>
                    setEventTitle(e.target.value)
                  }
                  className='w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent'
                  required
                />
              </div>
              <div>
                <label
                  htmlFor='eventDate'
                  className='block text-sm font-medium text-gray-700 mb-1'
                >
                  Fecha y hora
                </label>
                <input
                  id='eventDate'
                  type='datetime-local'
                  value={eventDate}
                  onChange={(e) =>
                    setEventDate(e.target.value)
                  }
                  className='w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent'
                  required
                />
              </div>
              <button
                type='submit'
                className='w-full py-2 px-4 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-medium rounded-md hover:from-teal-600 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition duration-200'
              >
                <span className='flex items-center justify-center'>
                  <svg
                    className='w-5 h-5 mr-2'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M12 6v6m0 0v6m0-6h6m-6 0H6'
                    />
                  </svg>
                  Agregar evento
                </span>
              </button>
            </form>
            {events.length === 0 ? (
              <div className='text-center py-8 text-gray-500'>
                <svg
                  className='w-16 h-16 mx-auto mb-4'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
                  />
                </svg>
                <p>No tienes eventos registrados.</p>
              </div>
            ) : (
              <ul className='space-y-3 mb-6'>
                {events.map((event) => (
                  <li
                    key={event.id}
                    className='bg-gray-50 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200'
                  >
                    <div className='flex justify-between items-start'>
                      <div>
                        <h3 className='font-semibold text-gray-800'>
                          {event.title}
                        </h3>
                        <p className='text-sm text-gray-600 mt-1'>
                          {new Date(
                            event.date.seconds * 1000,
                          ).toLocaleDateString('es-ES', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          openEventEditModal(event)
                        }
                        className='text-teal-600 hover:text-teal-800'
                      >
                        <svg
                          className='w-5 h-5'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z'
                          />
                        </svg>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <EditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title='Editar información del espacio'
        data={venue}
        fields={venueFormFields}
        onSave={handleEditVenue}
      />

      <EditModal
        isOpen={isEventEditModalOpen}
        onClose={() => {
          setIsEventEditModalOpen(false)
          setCurrentEvent(null)
        }}
        title='Editar evento'
        data={currentEvent}
        fields={eventFormFields}
        onSave={handleEditEvent}
        saveButtonText='Actualizar Evento'
      />

      <div className='w-fit mx-auto p-4'>
        <button
          onClick={async () => {
            try {
              await auth.signOut()
              router.push('/login')
            } catch (error) {
              console.error('Error signing out:', error)
            }
          }}
          className='w-full py-2 px-4 bg-red-500 text-white font-medium rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2'
        >
          Cerrar sesión
        </button>
      </div>
    </>
  )
}

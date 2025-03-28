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
  addDoc,
  collection,
  setDoc,
  getDocs,
  getDoc,
  deleteDoc,
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
import {
  compressImage,
  compressMultipleImages,
} from '../../utils/imageCompression'

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

// Helper function to get currency symbol from currency code
const getCurrencySymbol = (currencyCode) => {
  switch (currencyCode) {
    case 'USD':
      return '$'
    case 'EUR':
      return '€'
    case 'GBP':
      return '£'
    case 'BOB':
      return 'Bs'
    case 'BRL':
      return 'R$'
    case 'ARS':
      return '$'
    case 'CLP':
      return '$'
    case 'COP':
      return '$'
    case 'MXN':
      return '$'
    case 'PEN':
      return 'S/'
    case 'UYU':
      return '$U'
    case 'PYG':
      return '₲'
    default:
      return currencyCode || 'Bs' // Default to Bs if no currency code is provided
  }
}

// Function to sync venue data with venues_locations collection
const syncVenueLocationData = async (
  venueId,
  venueData,
) => {
  try {
    // Create a simplified venue location document
    await setDoc(
      doc(db, 'venues_locations', venueId),
      {
        name: venueData.name,
        address: venueData.address,
        city: venueData.city,
        country: venueData.country,
        location: venueData.location,
        logo: venueData.logo,
        active: venueData.active,
        lastUpdated: new Date().toISOString(),
      },
      { merge: true },
    )
  } catch (error) {
    console.error(
      'Error syncing venue location data:',
      error,
    )
  }
}

export default function Dashboard() {
  const [eventTitle, setEventTitle] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventDescription, setEventDescription] =
    useState('')
  const [eventCategory, setEventCategory] = useState('')
  const [eventPrice, setEventPrice] = useState('')
  const [eventCurrency, setEventCurrency] = useState('BOB') // Default to Boliviano
  const [eventTicketUrl, setEventTicketUrl] = useState('')
  const [eventImage, setEventImage] = useState(null)
  const [eventFormError, setEventFormError] = useState('')
  const [eventSuccess, setEventSuccess] = useState('')
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [eventsLoading, setEventsLoading] = useState(true)
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

  // Function to delete an event
  const deleteEvent = async (eventId, featuredImage) => {
    try {
      setLoading(true)

      // Delete the event from the main events collection
      const eventRef = doc(db, 'events', eventId)
      await deleteDoc(eventRef)

      // Delete the event from the venue's subcollection
      const venueEventRef = doc(
        db,
        'venues',
        venueId,
        'events',
        eventId,
      )
      await deleteDoc(venueEventRef)

      // Delete the featured image from storage if it exists
      if (featuredImage) {
        try {
          // Try first with the direct path from the structure
          const filePath = `venues/${venueId}/events/${eventId}`

          // Extract the filename from the URL
          const urlParts = featuredImage
            .split('?')[0]
            .split('/')
          const fileName = urlParts[urlParts.length - 1]

          // Construct the complete file path
          const completeFilePath = `${filePath}/${fileName}`

          const imageRef = ref(storage, completeFilePath)
          await deleteObject(imageRef)
        } catch (error) {
          console.error(
            'Error deleting event image:',
            error,
          )

          // If the first attempt fails, try with the extracted path from the URL
          try {
            console.log(
              'Attempting alternative deletion method',
            )

            // Get the path part of the URL (without the query parameters)
            const url = new URL(featuredImage)
            const pathName = decodeURIComponent(
              url.pathname,
            )

            // The path typically looks like /v0/b/BUCKET_NAME/o/ENCODED_FILE_PATH
            // We need to extract just the file path part
            const parts = pathName.split('/o/')
            if (parts.length > 1) {
              const encodedFilePath = parts[1]
              const filePath =
                decodeURIComponent(encodedFilePath)

              console.log(
                'Trying with extracted path:',
                filePath,
              )

              const directRef = ref(storage, filePath)
              await deleteObject(directRef)
              console.log(
                'Image deleted with alternative method',
              )
            }
          } catch (secondError) {
            console.error(
              'Both deletion attempts failed:',
              secondError,
            )
          }
        }
      }

      // Update local state to remove the deleted event
      setEvents(
        events.filter((event) => event.id !== eventId),
      )

      // Show success message
      setEventSuccess('¡Evento eliminado exitosamente!')
      setTimeout(() => {
        setEventSuccess('')
      }, 3000)
    } catch (error) {
      console.error('Error deleting event:', error)
      setEventFormError(
        'Error al eliminar el evento. Inténtelo de nuevo.',
      )
    } finally {
      setLoading(false)
    }
  }

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

    // Collect all new photos (File objects)
    const newPhotos = photos.filter(
      (photo) => typeof photo !== 'string',
    )

    // Compress all new photos before uploading
    const compressedPhotos = await compressMultipleImages(
      newPhotos,
    )

    // Upload the compressed photos
    for (const photo of compressedPhotos) {
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

  // Function to upload event image to Firebase Storage
  const uploadEventImage = async (file, eventId = null) => {
    try {
      if (!file || !venueId) return null

      // Compress the image before uploading
      const compressedFile = await compressImage(file)

      // Create a unique filename
      const filename = `${Date.now()}_${
        compressedFile.name
      }`

      // Create the storage path based on whether eventId is provided
      let storagePath
      if (eventId) {
        // New structure with eventId folder
        storagePath = `venues/${venueId}/events/${eventId}/${filename}`
      } else {
        // Use a temporary path for new events that don't have an ID yet
        storagePath = `venues/${venueId}/events/temp/${filename}`
      }

      const storageRef = ref(storage, storagePath)

      // Upload the compressed file
      await uploadBytes(storageRef, compressedFile)

      // Get download URL
      const downloadURL = await getDownloadURL(storageRef)
      return downloadURL
    } catch (error) {
      console.error('Error uploading event image:', error)
      return null
    }
  }

  // Function to add a new event to Firestore
  const addEvent = async (eventData) => {
    try {
      // Add event to Firestore events collection
      const eventRef = await addDoc(
        collection(db, 'events'),
        eventData,
      )

      const eventId = eventRef.id

      // Also add essential event data to the venues subcollection
      // This follows the structure defined in the Firestore rules: venues/{venueId}/events/{eventId}
      const venueEventRef = doc(
        db,
        'venues',
        venueId,
        'events',
        eventId,
      )

      // Only store required fields in the venues subcollection
      await setDoc(venueEventRef, {
        eventId: eventId,
        title: eventData.title,
        status: eventData.status,
        date: eventData.date, // Adding date to make sorting/filtering easier
        createdAt: Timestamp.now(),
      })

      // Return the ID of the newly created event
      return eventId
    } catch (error) {
      throw error
    }
  }

  const handleAddEvent = async (e) => {
    e.preventDefault()
    setLoading(true)
    setEventFormError('')
    setEventSuccess('')

    try {
      // Validate required fields
      if (!eventTitle.trim()) {
        throw new Error(
          'El título del evento es obligatorio',
        )
      }

      if (!eventDate) {
        throw new Error(
          'La fecha y hora del evento son obligatorias',
        )
      }

      if (!eventDescription.trim()) {
        throw new Error(
          'La descripción del evento es obligatoria',
        )
      }

      if (!eventCategory) {
        throw new Error(
          'La categoría del evento es obligatoria',
        )
      }

      if (!venueId) {
        throw new Error(
          'No se encontró información del local',
        )
      }

      // Validate date is in the future
      const eventDateTime = new Date(eventDate)
      if (eventDateTime < new Date()) {
        throw new Error(
          'La fecha del evento debe ser en el futuro',
        )
      }

      // Validate URL format if provided
      if (eventTicketUrl && !isValidUrl(eventTicketUrl)) {
        throw new Error(
          'El formato de la URL de venta de entradas no es válido',
        )
      }

      // Create new event data with comprehensive information
      const newEventData = {
        title: eventTitle.trim(),
        description: eventDescription.trim(),
        date: Timestamp.fromDate(new Date(eventDate)),
        category: eventCategory,
        price: eventPrice
          ? parseFloat(Number(eventPrice).toFixed(2))
          : 0,
        currency: eventCurrency,
        ticketUrl: eventTicketUrl
          ? eventTicketUrl.trim()
          : null,
        status: 'active',
        venueId: venueId,
        venueName: venue?.name || '',
        location: venue?.location || null,
        address: venue?.address || '',
        city: venue?.city || '',
        country: venue?.country || '',
        featuredImage: null, // Will be updated after we have the eventId
        capacity: venue?.capacity || null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      }

      // Add the event to Firestore
      const eventId = await addEvent(newEventData)

      // Upload the event image if one was provided, now using the eventId
      let imageUrl = null
      if (eventImage) {
        imageUrl = await uploadEventImage(
          eventImage,
          eventId,
        )

        // Update the event with the image URL
        if (imageUrl) {
          const eventRef = doc(db, 'events', eventId)
          await updateDoc(eventRef, {
            featuredImage: imageUrl,
          })
          newEventData.featuredImage = imageUrl
        }
      }

      // Update local state with new event
      setEvents([
        { id: eventId, ...newEventData },
        ...events,
      ])

      // Reset form fields
      setEventTitle('')
      setEventDate('')
      setEventDescription('')
      setEventCategory('')
      setEventPrice('')
      setEventCurrency('BOB')
      setEventTicketUrl('')
      setEventImage(null)

      // Show success message
      setEventSuccess('¡Evento agregado exitosamente!')

      // Scroll to top of form
      document
        .getElementById('eventTitle')
        ?.scrollIntoView({ behavior: 'smooth' })

      // Clear success message after 5 seconds
      setTimeout(() => {
        setEventSuccess('')
      }, 5000)
    } catch (error) {
      setEventFormError(
        error.message ||
          'Error al agregar el evento. Inténtelo de nuevo.',
      )

      // Scroll to error message
      document
        .querySelector('form')
        ?.scrollIntoView({ behavior: 'smooth' })
    } finally {
      setLoading(false)
    }
  }

  // Helper function to validate URLs
  const isValidUrl = (string) => {
    try {
      new URL(string)
      return true
    } catch (_) {
      return false
    }
  }

  // Fetch events from Firestore when component initializes or venueId changes
  useEffect(() => {
    const fetchEvents = async () => {
      if (!venueId) return

      try {
        setEventsLoading(true)

        // Get events from the venues/{venueId}/events subcollection
        const venueEventsRef = collection(
          db,
          'venues',
          venueId,
          'events',
        )
        const venueEventsSnapshot = await getDocs(
          venueEventsRef,
        )

        // Extract event IDs from the subcollection
        const eventIds = []
        venueEventsSnapshot.forEach((doc) => {
          eventIds.push(doc.id)
        })

        // If no events found, return empty array
        if (eventIds.length === 0) {
          setEvents([])
          setEventsLoading(false)
          return
        }

        // Fetch full event details from the main events collection
        const fetchedEvents = []

        // Use Promise.all to fetch all events in parallel
        await Promise.all(
          eventIds.map(async (eventId) => {
            const eventDocRef = doc(db, 'events', eventId)
            const eventSnapshot = await getDoc(eventDocRef)

            if (eventSnapshot.exists()) {
              fetchedEvents.push({
                id: eventId,
                ...eventSnapshot.data(),
              })
            }
          }),
        )

        // Sort events by date (most recent first)
        fetchedEvents.sort(
          (a, b) => b.date.seconds - a.date.seconds,
        )

        setEvents(fetchedEvents)
      } catch (error) {
        console.error('Error fetching events:', error)
      } finally {
        setEventsLoading(false)
      }
    }

    fetchEvents()
  }, [venueId])

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

      // Also sync to venues_locations collection
      await syncVenueLocationData(venueId, {
        ...formattedData,
        // Include fields that might not be in updatedData
        active: formattedData.active !== false,
      })

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

      // Create a copy of the data for formatting
      let formattedData = {
        ...updatedData,
        // Format date properly from datetime-local input to Firestore Timestamp
        date: updatedData.date
          ? Timestamp.fromDate(new Date(updatedData.date))
          : currentEvent.date,
        // Format price as number with 2 decimal places
        price:
          updatedData.price !== undefined
            ? parseFloat(
                Number(updatedData.price).toFixed(2),
              )
            : currentEvent.price,
        // Ensure currency is properly set
        currency:
          updatedData.currency ||
          currentEvent.currency ||
          'BOB',
        // Format ticketUrl to null if empty
        ticketUrl:
          updatedData.ticketUrl &&
          updatedData.ticketUrl.trim() !== ''
            ? updatedData.ticketUrl.trim()
            : null,
        // Add a timestamp for the update
        updatedAt: Timestamp.now(),
      }

      // Handle image upload if a new image was provided
      if (
        updatedData.featuredImage &&
        typeof updatedData.featuredImage !== 'string'
      ) {
        // If the image is a File object (new upload), upload it
        const imageUrl = await uploadEventImage(
          updatedData.featuredImage,
          currentEvent.id,
        )
        if (imageUrl) {
          formattedData.featuredImage = imageUrl
        }
      } else if (updatedData.featuredImage === null) {
        // If the image was explicitly set to null (removed), set it to null
        formattedData.featuredImage = null
      }
      // Otherwise, keep the existing image URL (it's already a string)

      // Update event in the main events collection
      const eventRef = doc(db, 'events', currentEvent.id)
      await updateDoc(eventRef, formattedData)

      // Also update the essential fields in the venue's subcollection
      const venueEventRef = doc(
        db,
        'venues',
        venueId,
        'events',
        currentEvent.id,
      )
      await updateDoc(venueEventRef, {
        title: formattedData.title,
        status: formattedData.status || 'active',
        date: formattedData.date,
        updatedAt: Timestamp.now(),
      })

      // Update the local state
      setEvents(
        events.map((event) =>
          event.id === currentEvent.id
            ? { ...event, ...formattedData }
            : event,
        ),
      )

      // Show success message
      setEventSuccess('¡Evento actualizado exitosamente!')
      setTimeout(() => {
        setEventSuccess('')
      }, 3000)

      // Close the modal and reset current event
      setIsEventEditModalOpen(false)
      setCurrentEvent(null)
    } catch (error) {
      console.error('Error updating event:', error)
      setEventFormError(
        error.message ||
          'Error al actualizar el evento. Inténtelo de nuevo.',
      )
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
    category: {
      type: 'select',
      label: 'Categoría',
      required: true,
      options: [
        { value: 'music', label: 'Música' },
        { value: 'art', label: 'Arte' },
        { value: 'theater', label: 'Teatro' },
        { value: 'dance', label: 'Danza' },
        { value: 'comedy', label: 'Comedia' },
        { value: 'workshop', label: 'Taller' },
        { value: 'other', label: 'Otro' },
      ],
    },
    date: {
      type: 'datetime-local',
      label: 'Fecha y hora',
      required: true,
    },
    price: {
      type: 'number',
      label: 'Precio',
      min: 0,
      step: '0.01',
      description: 'Deja en 0 si es gratis',
    },
    currency: {
      type: 'select',
      label: 'Moneda',
      required: true,
      options: [
        { value: 'BOB', label: 'Bs (BOB)' },
        { value: 'USD', label: '$ (USD)' },
        { value: 'EUR', label: '€ (EUR)' },
        { value: 'GBP', label: '£ (GBP)' },
        { value: 'BRL', label: 'R$ (BRL)' },
        { value: 'ARS', label: '$ (ARS)' },
        { value: 'CLP', label: '$ (CLP)' },
        { value: 'COP', label: '$ (COP)' },
        { value: 'MXN', label: '$ (MXN)' },
        { value: 'PEN', label: 'S/ (PEN)' },
        { value: 'UYU', label: '$U (UYU)' },
        { value: 'PYG', label: '₲ (PYG)' },
      ],
    },
    ticketUrl: {
      type: 'url',
      label: 'URL de venta de entradas',
      description:
        'Opcional: URL donde se pueden comprar entradas',
    },
    description: {
      type: 'textarea',
      label: 'Descripción',
      rows: 3,
      required: true,
    },
    featuredImage: {
      type: 'image',
      label: 'Imagen',
      description: 'Imagen principal del evento',
      accept: 'image/*',
    },
    status: {
      type: 'select',
      label: 'Estado del evento',
      required: true,
      options: [
        { value: 'active', label: 'Activo' },
        { value: 'cancelled', label: 'Cancelado' },
        { value: 'completed', label: 'Completado' },
        { value: 'postponed', label: 'Pospuesto' },
      ],
    },
  }

  // Function to open the event edit modal with current event data
  const openEventEditModal = (event) => {
    // Convert Timestamp to ISO string for the datetime-local input
    const date = event.date?.toDate
      ? event.date.toDate().toISOString().slice(0, 16)
      : new Date(event.date).toISOString().slice(0, 16)

    // Make sure ticketUrl is a string
    const ticketUrl = event.ticketUrl || ''

    // Format event data for the form
    const formattedEvent = {
      ...event,
      date,
      ticketUrl,
      // Make sure we have default values for new fields
      currency: event.currency || 'BOB',
      status: event.status || 'active',
    }

    // featuredImage should already be correctly set as a URL string
    // No need to modify it for the form

    // Set current event and open modal
    setCurrentEvent(formattedEvent)
    setIsEventEditModalOpen(true)
  }

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(
      (currentVenue) => {
        if (currentVenue) {
          setVenueId(currentVenue.uid)
        } else {
          // Redirect to login if not authenticated
          router.push('/login')
        }
        // Only set auth loading to false, not events loading
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [])

  if (loading || venueLoading) {
    return (
      <div className='min-h-screen flex justify-center items-center bg-gray-50'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500 mx-auto mb-4'></div>
          <p className='text-gray-600'>
            Cargando información...
          </p>
        </div>
      </div>
    )
  }

  if (venueError) {
    return <div>Error: {venueError}</div>
  }

  return (
    <>
      <div className='relative container mx-auto my-24'>
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
                mapId='dashboard-map'
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
                          className='w-full h-36 object-cover rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200'
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
                            className='w-full h-36 object-cover rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200'
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
              className='my-6 bg-white rounded-lg shadow-sm'
            >
              <h3 className='text-lg font-semibold w-fit text-gray-800 my-4 border-b pb-2'>
                Crear Nuevo Evento
              </h3>

              {/* Error message */}
              {eventFormError && (
                <div className='bg-red-50 border-l-4 border-red-500 p-4 mb-4'>
                  <p className='text-red-700 text-sm'>
                    {eventFormError}
                  </p>
                </div>
              )}

              {/* Success message */}
              {eventSuccess && (
                <div className='bg-green-50 border-l-4 border-green-500 p-4 mb-4'>
                  <p className='text-green-700 text-sm'>
                    {eventSuccess}
                  </p>
                </div>
              )}

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                {/* Title field */}
                <div className='col-span-2'>
                  <label
                    htmlFor='eventTitle'
                    className='block text-sm font-medium text-gray-700 mb-1'
                  >
                    Título del evento{' '}
                    <span className='text-red-500'>*</span>
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

                {/* Category field */}
                <div>
                  <label
                    htmlFor='eventCategory'
                    className='block text-sm font-medium text-gray-700 mb-1'
                  >
                    Categoría{' '}
                    <span className='text-red-500'>*</span>
                  </label>
                  <select
                    id='eventCategory'
                    value={eventCategory}
                    onChange={(e) =>
                      setEventCategory(e.target.value)
                    }
                    className='w-full p-2 border bg-white border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent'
                    required
                  >
                    <option value=''>
                      Seleccionar categoría
                    </option>
                    <option value='music'>Música</option>
                    <option value='art'>Arte</option>
                    <option value='theater'>Teatro</option>
                    <option value='dance'>Danza</option>
                    <option value='comedy'>Comedia</option>
                    <option value='workshop'>Taller</option>
                    <option value='other'>Otro</option>
                  </select>
                </div>

                {/* Date and time field */}
                <div>
                  <label
                    htmlFor='eventDate'
                    className='block text-sm font-medium text-gray-700 mb-1'
                  >
                    Fecha y hora{' '}
                    <span className='text-red-500'>*</span>
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

                {/* Price field */}
                <div>
                  <label
                    htmlFor='eventPrice'
                    className='block text-sm font-medium text-gray-700 mb-1'
                  >
                    Precio
                  </label>
                  <div className='flex gap-2'>
                    <div className='relative flex-1'>
                      <input
                        id='eventPrice'
                        type='number'
                        min='0'
                        step='0.01'
                        placeholder='0.00'
                        value={eventPrice}
                        onChange={(e) =>
                          setEventPrice(e.target.value)
                        }
                        className='w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent'
                      />
                    </div>
                    <select
                      id='eventCurrency'
                      value={eventCurrency}
                      onChange={(e) =>
                        setEventCurrency(e.target.value)
                      }
                      className='w-24 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent'
                    >
                      <option value='BOB'>Bs (BOB)</option>
                      <option value='USD'>$ (USD)</option>
                      <option value='EUR'>€ (EUR)</option>
                      <option value='GBP'>£ (GBP)</option>
                      <option value='BRL'>R$ (BRL)</option>
                      <option value='ARS'>$ (ARS)</option>
                      <option value='CLP'>$ (CLP)</option>
                      <option value='COP'>$ (COP)</option>
                      <option value='MXN'>$ (MXN)</option>
                      <option value='PEN'>S/ (PEN)</option>
                      <option value='UYU'>$U (UYU)</option>
                      <option value='PYG'>₲ (PYG)</option>
                    </select>
                  </div>
                  <p className='text-xs text-gray-500 mt-1'>
                    Deja en blanco si es gratis
                  </p>
                </div>

                {/* Ticket URL field */}
                <div className='col-span-2'>
                  <label
                    htmlFor='eventTicketUrl'
                    className='block text-sm font-medium text-gray-700 mb-1'
                  >
                    URL de venta de entradas
                  </label>
                  <input
                    id='eventTicketUrl'
                    type='url'
                    placeholder='https://ejemplo.com/tickets'
                    value={eventTicketUrl}
                    onChange={(e) =>
                      setEventTicketUrl(e.target.value)
                    }
                    className='w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent'
                  />
                  <p className='text-xs text-gray-500 mt-1'>
                    Opcional: URL donde se pueden comprar
                    entradas
                  </p>
                </div>

                {/* Description field */}
                <div className='col-span-2'>
                  <label
                    htmlFor='eventDescription'
                    className='block text-sm font-medium text-gray-700 mb-1'
                  >
                    Descripción{' '}
                    <span className='text-red-500'>*</span>
                  </label>
                  <textarea
                    id='eventDescription'
                    rows='4'
                    placeholder='Describe el evento, artistas, horarios, etc.'
                    value={eventDescription}
                    onChange={(e) =>
                      setEventDescription(e.target.value)
                    }
                    className='w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent'
                    required
                  ></textarea>
                </div>

                {/* Featured image field */}
                <div className='col-span-2'>
                  <label
                    htmlFor='eventImage'
                    className='block text-sm font-medium text-gray-700 mb-1'
                  >
                    Imagen
                  </label>
                  <div className='flex items-center gap-4'>
                    <input
                      id='eventImage'
                      type='file'
                      accept='image/*'
                      onChange={(e) => {
                        if (
                          e.target.files &&
                          e.target.files[0]
                        ) {
                          setEventImage(e.target.files[0])
                        }
                      }}
                      className='flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent'
                    />
                    {eventImage && (
                      <div className='h-16 w-16 relative border rounded overflow-hidden'>
                        <img
                          src={URL.createObjectURL(
                            eventImage,
                          )}
                          alt='Vista previa'
                          className='h-full w-full object-cover'
                        />
                        <button
                          type='button'
                          onClick={() =>
                            setEventImage(null)
                          }
                          className='absolute top-0 right-0 bg-red-500 text-white p-1 rounded-bl'
                        >
                          <svg
                            className='w-3 h-3'
                            fill='none'
                            viewBox='0 0 24 24'
                            stroke='currentColor'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M6 18L18 6M6 6l12 12'
                            />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                  <p className='text-xs text-gray-500 mt-1'>
                    Recomendado: imagen en formato 16:9 para
                    mejor visualización
                  </p>
                </div>
              </div>

              {/* Submit button */}
              <div className='mt-8'>
                <button
                  type='submit'
                  disabled={loading}
                  className='w-full py-3 px-4 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-medium rounded-md hover:from-teal-600 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition duration-200 disabled:opacity-70 disabled:cursor-not-allowed'
                >
                  <span className='flex items-center justify-center'>
                    {loading ? (
                      <>
                        <svg
                          className='animate-spin -ml-1 mr-2 h-4 w-4 text-white'
                          xmlns='http://www.w3.org/2000/svg'
                          fill='none'
                          viewBox='0 0 24 24'
                        >
                          <circle
                            className='opacity-25'
                            cx='12'
                            cy='12'
                            r='10'
                            stroke='currentColor'
                            strokeWidth='4'
                          ></circle>
                          <path
                            className='opacity-75'
                            fill='currentColor'
                            d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                          ></path>
                        </svg>
                        Procesando...
                      </>
                    ) : (
                      <>
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
                      </>
                    )}
                  </span>
                </button>
              </div>
            </form>
            <h3 className='text-lg font-semibold w-fit text-gray-800 mb-4 border-b pb-2'>
              Listado de eventos
            </h3>
            {eventsLoading ? (
              <div className='text-center py-8'>
                <div className='animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500 mx-auto mb-4'></div>
                <p className='text-gray-500'>
                  Cargando eventos...
                </p>
              </div>
            ) : events.length === 0 ? (
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
                      <div className='flex-1'>
                        <div className='flex items-center gap-2'>
                          <h3 className='font-semibold text-gray-800'>
                            {event.title}
                          </h3>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              event.category === 'music'
                                ? 'bg-blue-100 text-blue-800'
                                : event.category === 'art'
                                ? 'bg-purple-100 text-purple-800'
                                : event.category ===
                                  'theater'
                                ? 'bg-yellow-100 text-yellow-800'
                                : event.category === 'dance'
                                ? 'bg-pink-100 text-pink-800'
                                : event.category ===
                                  'comedy'
                                ? 'bg-green-100 text-green-800'
                                : event.category ===
                                  'workshop'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {event.category === 'music'
                              ? 'Música'
                              : event.category === 'art'
                              ? 'Arte'
                              : event.category === 'theater'
                              ? 'Teatro'
                              : event.category === 'dance'
                              ? 'Danza'
                              : event.category === 'comedy'
                              ? 'Comedia'
                              : event.category ===
                                'workshop'
                              ? 'Taller'
                              : event.category === 'other'
                              ? 'Otro'
                              : event.category ||
                                'Sin categoría'}
                          </span>
                        </div>
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
                        <div className='flex gap-4 mt-2 text-xs text-gray-500'>
                          <span className='flex items-center'>
                            <svg
                              className='w-4 h-4 mr-1'
                              fill='none'
                              stroke='currentColor'
                              viewBox='0 0 24 24'
                            >
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                              />
                            </svg>
                            {event.price > 0
                              ? getCurrencySymbol(
                                  event.currency,
                                ) +
                                ' ' +
                                event.price
                              : 'Gratis'}
                          </span>
                          {event.ticketUrl && (
                            <a
                              href={event.ticketUrl}
                              target='_blank'
                              rel='noopener noreferrer'
                              className='flex items-center text-teal-600 hover:text-teal-800'
                            >
                              <svg
                                className='w-4 h-4 mr-1'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                              >
                                <path
                                  strokeLinecap='round'
                                  strokeLinejoin='round'
                                  strokeWidth={2}
                                  d='M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z'
                                />
                              </svg>
                              Boletos
                            </a>
                          )}
                        </div>
                      </div>
                      <div className='flex gap-2'>
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
                        <button
                          onClick={() => {
                            if (
                              window.confirm(
                                '¿Estás seguro de que deseas eliminar este evento? Esta acción no se puede deshacer.',
                              )
                            ) {
                              deleteEvent(
                                event.id,
                                event.featuredImage,
                              )
                            }
                          }}
                          className='text-red-600 hover:text-red-800'
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
                              d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                            />
                          </svg>
                        </button>
                      </div>
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

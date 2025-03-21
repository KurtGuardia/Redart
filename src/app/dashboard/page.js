'use client'

import { useState, useEffect } from 'react'
import { auth } from '../../lib/firebase-client'
import { Timestamp } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useVenueData } from '@/src/hooks/useVenueData'
import Spot from '@/src/components/Spot'

const MapComponent = dynamic(
  () => import('../../components/MapComponent'),
  {
    ssr: false,
  },
)

export default function Dashboard() {
  const [eventTitle, setEventTitle] = useState('')
  const [eventDate, setEventDate] = useState('')
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState([])
  const [venueId, setVenueId] = useState(null)
  const {
    venue,
    loading: venueLoading,
    error: venueError,
  } = useVenueData(venueId)

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
            </h2>

            {/* Logo and venue name */}
            {venue.logo && (
              <div className='flex items-center mb-4'>
                <img
                  src={venue.logo}
                  alt={`Logo de ${venue.name}`}
                  className='w-20 h-20 object-cover rounded-full border-2 border-teal-500 shadow-md mr-4'
                />
                <h3 className='text-xl font-bold text-gray-800'>
                  {venue.name}
                </h3>
              </div>
            )}

            <div className='rounded-lg overflow-hidden mb-4'>
              <MapComponent
                venues={[venue]}
                center={[
                  venue.location.latitude,
                  venue.location.longitude,
                ]}
                zoom={15}
              />
            </div>

            {/* Location info */}
            <div className='bg-gray-50 p-4 rounded-lg mb-4'>
              <h3 className='font-semibold text-gray-700 mb-2'>
                Ubicación
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
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M3 21l18 0M3 10l18 0M5 6l0 -3l14 0l0 3M7 21l0 -4M17 21l0 -4M14 10l0 -7M10 10l0 -7M8 3L8 7M16 3L16 7'
                    />
                  </svg>
                  {venue.city}, {venue.country}
                </p>
              )}
            </div>

            {/* Description */}
            <div className='bg-gray-50 p-4 rounded-lg mb-4'>
              <h3 className='font-semibold text-gray-700 mb-2'>
                Descripción
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
                  Capacidad
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
                    Comodidades
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
                  Contacto
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
                      d='M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
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
                  Fotos
                </h3>
                <div className='grid grid-cols-3 gap-2'>
                  {venue.photos.map((photo, index) => (
                    <img
                      key={index}
                      src={photo}
                      alt={`Foto ${index + 1} de ${
                        venue.name
                      }`}
                      className='w-full h-20 object-cover rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer'
                    />
                  ))}
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
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
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

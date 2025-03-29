'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../../../lib/firebase-client'
import Image from 'next/image'
import Link from 'next/link'
import Spot from '../../../components/Spot'
import EventCard from '../../../components/EventCard'
import EventDetailModal from '../../../components/EventDetailModal'

// Simple SVG Icon for location pin
const LocationPinIcon = () => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    className='h-5 w-5 inline-block mr-1 text-[var(--teal-700)]'
    viewBox='0 0 20 20'
    fill='currentColor'
  >
    <path
      fillRule='evenodd'
      d='M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z'
      clipRule='evenodd'
    />
  </svg>
)

export default function VenuePage() {
  const params = useParams()
  const venueId = params?.venueId
  const [venue, setVenue] = useState(null)
  const [venueEvents, setVenueEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingEvents, setLoadingEvents] = useState(true)
  const [error, setError] = useState(null)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedImageUrl, setSelectedImageUrl] =
    useState(null)

  const openModal = (event) => {
    setSelectedEvent(event)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setSelectedEvent(null)
    setIsModalOpen(false)
  }

  useEffect(() => {
    const fetchVenue = async () => {
      if (!venueId) {
        setError('Venue ID no encontrado.')
        setLoading(false)
        return
      }
      setLoading(true)
      setError(null)
      try {
        const venueDocRef = doc(db, 'venues', venueId)
        const venueDocSnap = await getDoc(venueDocRef)
        if (venueDocSnap.exists()) {
          const venueData = venueDocSnap.data()
          setVenue({ id: venueDocSnap.id, ...venueData })
          if (
            venueData.photos &&
            venueData.photos.length > 0
          ) {
            setSelectedImageUrl(venueData.photos[0])
          }
        } else {
          setError('Lugar no encontrado.')
        }
      } catch (err) {
        console.error('Error fetching venue:', err)
        setError('Error al cargar los detalles del lugar.')
      } finally {
        setLoading(false)
      }
    }
    fetchVenue()
  }, [venueId])

  useEffect(() => {
    const fetchVenueEvents = async () => {
      if (!venueId) return

      setLoadingEvents(true)
      try {
        const eventsCollectionPath = `venues/${venueId}/events`
        const eventsRef = collection(
          db,
          eventsCollectionPath,
        )

        const q = query(
          eventsRef,
          where('date', '>=', Timestamp.now()),
          orderBy('date', 'asc'),
        )
        const querySnapshot = await getDocs(q)
        const events = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        console.log(events)
        setVenueEvents(events)
      } catch (err) {
        console.error('Error fetching venue events:', err)
      } finally {
        setLoadingEvents(false)
      }
    }

    fetchVenueEvents()
  }, [venueId])

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        Cargando...
      </div>
    )
  }

  if (error) {
    return (
      <div className='min-h-screen flex items-center justify-center text-red-600'>
        {error}
      </div>
    )
  }

  if (!venue) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        Lugar no encontrado.
      </div>
    )
  }

  const heroImageUrl =
    selectedImageUrl ||
    (venue.photos && venue.photos.length > 0
      ? venue.photos[0]
      : null)
  const allGalleryImages = venue.photos || []

  let googleMapsUrl = '#'
  if (
    venue.location?.latitude &&
    venue.location?.longitude
  ) {
    googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${venue.location.latitude},${venue.location.longitude}`
  } else {
    const googleMapsQuery = encodeURIComponent(
      `${venue.address}, ${venue.city}, ${venue.country}`,
    )
    googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${googleMapsQuery}`
  }

  return (
    <div className='relative min-h-screen'>
      {/* Background Spots */}
      <Spot colorName={'Teal'} />
      <Spot colorName={'Cyan'} />
      <Spot colorName={'SkyBlue'} />
      <Spot colorName={'Indigo'} />

      {/* Hero Section */}
      <div
        className={`relative w-full ${
          heroImageUrl ? 'h-64 md:h-80' : 'h-40'
        } flex items-center justify-center text-center overflow-hidden mb-12 shadow-lg`}
      >
        {heroImageUrl ? (
          <>
            <Image
              src={heroImageUrl}
              alt={`${venue.name} featured image`}
              layout='fill'
              objectFit='cover'
              className='absolute inset-0 z-0'
              priority
            />
            <div className='absolute inset-0 bg-black/60 z-10'></div>
          </>
        ) : (
          <div className='absolute inset-0 bg-gradient-to-br from-[var(--teal-700)] to-[var(--blue-800)] z-0'></div>
        )}
        <div className='relative z-20 p-4 text-white'>
          <h1 className='text-4xl md:text-6xl font-extrabold mb-2 text-shadow-md'>
            {venue.name}
          </h1>
          <a
            href={googleMapsUrl}
            target='_blank'
            rel='noopener noreferrer'
            className='inline-block text-lg md:text-xl font-medium text-gray-200 hover:text-white hover:underline transition-colors duration-200'
          >
            <LocationPinIcon />
            {venue.address} - {venue.city}, {venue.country}
          </a>
        </div>
      </div>

      {/* Main Content Area */}
      <div className='container mx-auto px-4 pb-24'>
        <div className='bg-gradient-to-br from-white to-gray-100/80 backdrop-blur-lg rounded-xl shadow-xl p-6 md:p-10'>
          {/* Venue Description */}
          {venue.description && (
            <section className='mb-10 md:mb-12 border-b border-gray-200/80 pb-8'>
              <h2 className='text-2xl md:text-3xl font-bold text-[var(--teal-800)] mb-4'>
                Acerca del Lugar
              </h2>
              <p className='text-gray-700 whitespace-pre-wrap leading-relaxed text-base md:text-lg'>
                {venue.description}
              </p>
            </section>
          )}

          {/* Interactive Photo Gallery (Max 5 images - Featured + Clickable Grid) */}
          {venue.photos && venue.photos.length > 0 && (
            <section className='mb-10 md:mb-12 border-b border-gray-200/80 pb-8'>
              <h2 className='text-2xl md:text-3xl font-bold text-[var(--teal-800)] mb-6'>
                Galería
              </h2>
              <div className='space-y-4 md:space-y-6'>
                {/* Large Featured Image Display */}
                {selectedImageUrl && (
                  <div className='relative w-full aspect-[16/9] rounded-xl overflow-hidden shadow-lg'>
                    <Image
                      src={selectedImageUrl}
                      alt={`${venue.name} selected photo`}
                      layout='fill'
                      objectFit='cover'
                    />
                  </div>
                )}

                {/* Grid for all images as thumbnails (Clickable) */}
                {allGalleryImages.length > 1 && (
                  <div
                    className={`grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 md:gap-4`}
                  >
                    {allGalleryImages.map(
                      (photoUrl, index) => (
                        <div
                          key={index}
                          onClick={() =>
                            setSelectedImageUrl(photoUrl)
                          }
                          className={`relative aspect-square rounded-lg overflow-hidden shadow-md group cursor-pointer border-2 ${
                            selectedImageUrl === photoUrl
                              ? 'border-[var(--teal-500)]'
                              : 'border-transparent'
                          } hover:border-[var(--teal-300)] transition-all duration-200`}
                        >
                          <Image
                            src={photoUrl}
                            alt={`${venue.name} thumbnail ${
                              index + 1
                            }`}
                            layout='fill'
                            objectFit='cover'
                            className='transition-transform duration-300 ease-in-out group-hover:scale-110'
                          />
                          <div
                            className={`absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 ${
                              selectedImageUrl === photoUrl
                                ? 'opacity-100 bg-black/20'
                                : ''
                            } transition-opacity duration-300 ease-in-out`}
                          ></div>
                        </div>
                      ),
                    )}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Upcoming Events Section */}
          <section>
            <h2 className='text-2xl md:text-3xl font-bold text-[var(--teal-800)] mb-6'>
              Próximos Eventos en {venue.name}
            </h2>
            {loadingEvents ? (
              <div className='text-center text-gray-500'>
                Cargando eventos...
              </div>
            ) : venueEvents.length > 0 ? (
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8'>
                {venueEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    onClick={() => openModal(event)}
                    className='cursor-pointer h-full'
                    title={event.title}
                    description={
                      event.description
                        ? event.description.substring(
                            0,
                            100,
                          ) + '...'
                        : ''
                    }
                    date={
                      event.date && event.date.seconds
                        ? new Date(
                            event.date.seconds * 1000,
                          ).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : 'Fecha no disponible'
                    }
                    location={
                      event.city ||
                      'Ubicación no disponible'
                    }
                    image={
                      event.featuredImage ||
                      '/placeholder.svg'
                    }
                  />
                ))}
              </div>
            ) : (
              <div className='text-center text-gray-500 italic p-6 border border-dashed border-gray-300 rounded-lg'>
                No hay próximos eventos programados en este
                lugar por el momento.
              </div>
            )}
          </section>
        </div>
      </div>
      <EventDetailModal
        isOpen={isModalOpen}
        onClose={closeModal}
        event={selectedEvent}
      />
    </div>
  )
}

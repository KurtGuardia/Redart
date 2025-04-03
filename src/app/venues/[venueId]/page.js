'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import {
  doc,
  getDoc,
  collection,
  query,
  getDocs,
  orderBy,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../../../lib/firebase-client'
import Image from 'next/image'
import Spot from '../../../components/ui/Spot'
import VenueEventListItem from '../../../components/VenueEventListItem'
import EventDetailModal from '../../../components/EventDetailModal'
import MapComponent from '../../../components/MapComponent'
import { useVenueData } from '../../../hooks/useVenueData'
import { formatWhatsappNumber } from '../../../lib/utils'

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

  const { venue, loading, error } = useVenueData(venueId)

  const [venueEvents, setVenueEvents] = useState([])
  const [loadingEvents, setLoadingEvents] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedImageUrl, setSelectedImageUrl] =
    useState(null)

  const openModal = (fullEventDataFromList) => {
    setSelectedEvent(fullEventDataFromList)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setSelectedEvent(null)
    setIsModalOpen(false)
  }

  useEffect(() => {
    if (venue && venue.photos && venue.photos.length > 0) {
      if (!selectedImageUrl) {
        setSelectedImageUrl(venue.photos[0])
      }
    }
  }, [venue, selectedImageUrl])

  useEffect(() => {
    const fetchVenueEvents = async () => {
      if (!venueId) return

      setLoadingEvents(true)
      setVenueEvents([])
      try {
        const eventsSubcollectionPath = `venues/${venueId}/events`
        const eventsSubcollectionRef = collection(
          db,
          eventsSubcollectionPath,
        )
        const subcollectionSnapshot = await getDocs(
          query(eventsSubcollectionRef),
        )

        if (subcollectionSnapshot.empty) {
          setLoadingEvents(false)
          return
        }

        const fetchPromises =
          subcollectionSnapshot.docs.map((subDoc) => {
            const eventId = subDoc.id
            const fullEventDocRef = doc(
              db,
              'events',
              eventId,
            )
            return getDoc(fullEventDocRef)
          })

        const fullEventDocSnaps = await Promise.all(
          fetchPromises,
        )

        const events = fullEventDocSnaps
          .map((docSnap) =>
            docSnap.exists()
              ? { id: docSnap.id, ...docSnap.data() }
              : null,
          )
          .filter((event) => event !== null)
          .filter(
            (event) =>
              event.date &&
              event.date.seconds >= Timestamp.now().seconds,
          )
          .sort((a, b) => a.date.seconds - b.date.seconds)

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
        Error al cargar el lugar: {error.message}
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
    <div className='relative min-h-screen min-w-[80%]'>
      {/* Background Spots */}
      <Spot colorName={'Teal'} />
      <Spot colorName={'Cyan'} />
      <Spot colorName={'SkyBlue'} />
      <Spot colorName={'Indigo'} />

      {/* Hero Section */}
      <div
        className={`relative w-full h-64 md:h-96 flex items-center justify-center text-center overflow-hidden mb-12 shadow-lg`}
      >
        {heroImageUrl ? (
          <>
            <Image
              src={heroImageUrl}
              alt={`${venue.name} featured image`}
              fill
              className='absolute inset-0 z-0 object-cover'
              priority
            />
            <div className='absolute inset-0 bg-black/60 z-10'></div>
          </>
        ) : (
          <div className='absolute inset-0 bg-gradient-to-br from-[var(--teal-700)] to-[var(--blue-800)] z-0'></div>
        )}
        <div className='relative z-20 p-4 text-white'>
          <h1
            className='inline-block bg-[radial-gradient(var(--white),transparent)] p-8 rounded-full text-4xl md:text-6xl font-extrabold mb-4'
            style={{ textShadow: '-2px 3px 7px #000' }}
          >
            {venue.name}
          </h1>
          <div>
            <a
              href={googleMapsUrl}
              target='_blank'
              rel='noopener noreferrer'
              className='inline-block text-lg md:text-xl font-medium text-gray-200 hover:text-white hover:underline transition-colors duration-200'
            >
              <LocationPinIcon />
              {venue.address} - {venue.city},{' '}
              {venue.country}
            </a>
          </div>
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

          {/* == NEW SECTION: Map & Details == */}
          <section className='mb-10 md:mb-12 border-b border-gray-200/80 pb-8'>
            <div className='flex flex-col lg:flex-row gap-8 lg:gap-12'>
              {/* Left Column: Map */}
              <div className='lg:w-1/2 flex flex-col'>
                <h2 className='text-2xl md:text-3xl font-bold text-[var(--teal-800)] mb-1'>
                  Ubicación en el Mapa
                </h2>
                <p className='text-sm text-gray-500 mb-4'>
                  {venue.city}, {venue.country}
                </p>
                {venue.location?.latitude &&
                venue.location?.longitude ? (
                  <div className='h-80 md:h-96 w-full'>
                    <MapComponent
                      venues={[
                        {
                          id: venue.id,
                          name: venue.name,
                          location: venue.location,
                          address: venue.address,
                        },
                      ]}
                      center={[
                        venue.location.latitude,
                        venue.location.longitude,
                      ]}
                      zoom={16}
                      small={true}
                    />
                  </div>
                ) : (
                  <div className='h-80 md:h-96 w-full flex items-center justify-center bg-gray-100 text-gray-500 italic'>
                    Ubicación no disponible en el mapa.
                  </div>
                )}
                {venue.address && (
                  <p className='text-center text-gray-700 text-sm md:text-base mt-4'>
                    <LocationPinIcon /> {venue.address}
                  </p>
                )}
              </div>

              {/* Right Column: Details */}
              <div className='lg:w-1/2 space-y-6'>
                <h2 className='text-2xl md:text-3xl font-bold text-[var(--teal-800)] mb-4'>
                  Detalles Adicionales
                </h2>

                {/* Logo */}
                {venue.logo && (
                  <div className='flex justify-center md:justify-start mb-4'>
                    <Image
                      src={venue.logo}
                      alt={`${venue.name} Logo`}
                      width={150} // Adjust size as needed
                      height={100} // Adjust size as needed
                      objectFit='contain'
                      className='rounded-md'
                    />
                  </div>
                )}

                {/* Capacity */}
                {venue.capacity && (
                  <div className='flex items-center gap-3'>
                    <span
                      className='text-2xl'
                      title='Capacidad'
                    >
                      👥
                    </span>
                    <div>
                      <h3 className='font-semibold text-gray-700'>
                        Capacidad
                      </h3>
                      <p className='text-gray-900'>
                        {venue.capacity} personas
                      </p>
                    </div>
                  </div>
                )}

                {/* Amenities */}
                {venue.amenities &&
                  venue.amenities.length > 0 && (
                    <div>
                      <h3 className='font-semibold text-gray-700 mb-2 flex items-center gap-2'>
                        <span className='text-xl'>✨</span>
                        Servicios
                      </h3>
                      <ul className='list-none space-y-1 pl-8'>
                        {venue.amenities.map(
                          (amenity, index) => (
                            <li
                              key={index}
                              className='flex items-center text-gray-800'
                            >
                              <span className='text-green-500 mr-2'>
                                ✓
                              </span>{' '}
                              {amenity}
                            </li>
                          ),
                        )}
                      </ul>
                    </div>
                  )}

                {/* Social Media / WhatsApp Contact */}
                {(venue.facebookUrl ||
                  venue.instagramUrl ||
                  venue.whatsappNumber) && (
                  <div>
                    <h3 className='font-semibold text-gray-700 mb-2 flex items-center gap-2'>
                      <span className='text-xl'>🌐</span>
                      Contacto / Redes
                    </h3>
                    <div className='space-y-2 pl-8'>
                      {venue.facebookUrl && (
                        <a
                          href={venue.facebookUrl}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline'
                          title={venue.facebookUrl}
                        >
                          <svg
                            className='w-5 h-5 fill-current'
                            viewBox='0 0 24 24'
                          >
                            <path d='M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z' />
                          </svg>
                          <span className='truncate'>
                            Facebook
                          </span>
                        </a>
                      )}
                      {venue.instagramUrl && (
                        <a
                          href={venue.instagramUrl}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='flex items-center gap-2 text-pink-600 hover:text-pink-800 hover:underline'
                          title={venue.instagramUrl}
                        >
                          <svg
                            className='w-5 h-5 fill-current'
                            viewBox='0 0 24 24'
                          >
                            <path d='M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919C8.417 2.175 8.796 2.163 12 2.163zm0 1.441c-3.118 0-3.479.013-4.699.068-2.636.121-3.773 1.24-3.894 3.894C3.35 8.837 3.337 9.197 3.337 12c0 2.803.013 3.163.068 4.382.121 2.653 1.258 3.773 3.894 3.894 1.22.055 1.58.068 4.699.068 3.118 0 3.479-.013 4.699-.068 2.636-.121 3.773-1.24 3.894-3.894.055-1.219.068-1.579.068-4.382 0-2.803-.013-3.163-.068-4.382-.121-2.653-1.258-3.773-3.894-3.894C15.583 3.617 15.223 3.604 12 3.604zm0 3.071a5.27 5.27 0 100 10.54 5.27 5.27 0 000-10.54zm0 1.441a3.829 3.829 0 110 7.658 3.829 3.829 0 010-7.658zM16.965 6.516a1.2 1.2 0 100 2.4 1.2 1.2 0 000-2.4z' />
                          </svg>
                          <span className='truncate'>
                            Instagram
                          </span>
                        </a>
                      )}
                      {venue.whatsappNumber && (
                        <a
                          href={`https://wa.me/${venue.whatsappNumber.replace(
                            /\D/g,
                            '',
                          )}`}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='flex items-center gap-2 text-green-600 hover:text-green-800 hover:underline'
                          title={venue.whatsappNumber}
                        >
                          <svg
                            className='w-5 h-5 fill-current'
                            viewBox='0 0 24 24'
                          >
                            <path d='M16.75 13.96c.25.13.41.3.46.4.06.1.04.24 0 .38-.03.12-.18.26-.39.41-.21.15-.46.28-.74.39-.28.11-.58.17-.88.17-.34 0-.68-.06-1.03-.18-.34-.12-.68-.29-1.02-.51-.34-.21-.67-.48-.98-.79-.32-.31-.6-.67-.85-1.08-.25-.41-.42-.88-.51-1.39-.09-.51-.14-1.04-.14-1.61 0-.56.05-1.11.14-1.61s.25-.96.49-1.38c.24-.42.55-.78.91-1.08.36-.3.78-.53 1.25-.69.47-.16.97-.24 1.52-.24.54 0 1.06.08 1.54.24.48.16.91.4 1.29.71.38.31.69.7.91 1.15.22.45.35.95.4 1.5.04.55.06 1.12.06 1.73 0 .29-.01.57-.03.84-.02.27-.06.53-.11.78zm-4.8-3.87c-.15-.42-.4-.76-.74-1.03-.34-.27-.74-.4-1.18-.4-.46 0-.89.13-1.27.4-.38.27-.67.63-.85 1.06-.18.43-.27.91-.27 1.44 0 .53.09 1.01.27 1.44.18.43.47.79.85 1.06.38.27.81.4 1.27.4.44 0 .84-.13 1.18-.4.34-.27.59-.61.74-1.03.15-.42.22-.88.22-1.39 0-.51-.07-.97-.22-1.39zm5.42-1.56c-.16-.08-.36-.13-.59-.13-.24 0-.46.05-.63.16-.18.11-.34.26-.47.45-.13.19-.22.41-.28.66-.06.25-.09.53-.09.82v1.1c0 .29.03.57.09.83.06.26.15.49.28.68.13.19.29.35.47.46.18.11.39.17.63.17.23 0 .43-.05.59-.16.16-.11.3-.26.41-.46.11-.2.18-.42.22-.68.04-.26.06-.54.06-.83v-1.1c0-.29-.02-.57-.06-.82-.04-.25-.11-.48-.22-.66-.11-.18-.25-.33-.41-.45z' />
                          </svg>
                          <span className='truncate'>
                            {formatWhatsappNumber(
                              venue.whatsappNumber,
                            )}
                          </span>
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Active Status (Subtle) */}
                <div className='flex items-center gap-2 pt-2'>
                  <span
                    className={`h-3 w-3 rounded-full ${
                      venue.active
                        ? 'bg-green-500'
                        : 'bg-red-500'
                    }`}
                  ></span>
                  <span className='text-sm text-gray-600'>
                    {venue.active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>
            </div>
          </section>
          {/* == END NEW SECTION == */}

          {/* Upcoming Events Section - Using new List Item Component */}
          <section>
            <h2 className='text-2xl md:text-3xl font-bold text-[var(--teal-800)] mb-6'>
              Próximos Eventos en {venue.name}
            </h2>
            {loadingEvents ? (
              <div className='text-center text-gray-500'>
                Cargando eventos...
              </div>
            ) : venueEvents.length > 0 ? (
              // Use a simple div container for the vertical list, add spacing between items
              <div className='space-y-4'>
                {venueEvents.map((event) => (
                  <VenueEventListItem
                    key={event.id}
                    event={event} // Pass the event object from subcollection
                    onOpenModal={openModal} // Pass the openModal function
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

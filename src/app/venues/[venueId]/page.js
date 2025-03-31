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
import Link from 'next/link'
import Spot from '../../../components/Spot'
import VenueEventListItem from '../../../components/VenueEventListItem'
import EventDetailModal from '../../../components/EventDetailModal'
import MapComponent from '../../../components/MapComponent'
import { useVenueData } from '../../../hooks/useVenueData'

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

                {/* Social Media Links with SVG Icons */}
                <div>
                  <h3 className='font-semibold text-gray-700 mb-2 flex items-center gap-2'>
                    <span className='text-xl'>🌐</span>Redes
                    Sociales
                  </h3>
                  <div className='flex items-center space-x-4 pl-8'>
                    {/* Facebook Icon */}
                    <a
                      href='#'
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-[var(--facebook)] hover:opacity-80 transition-opacity'
                      title='Facebook'
                    >
                      <span className='sr-only'>
                        Facebook
                      </span>
                      <svg
                        className='h-6 w-6'
                        fill='currentColor'
                        viewBox='0 0 24 24'
                        aria-hidden='true'
                      >
                        <path
                          fillRule='evenodd'
                          d='M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z'
                          clipRule='evenodd'
                        />
                      </svg>
                    </a>
                    {/* Instagram Icon */}
                    <a
                      href='#'
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-[var(--instagram)] hover:opacity-80 transition-opacity'
                      title='Instagram'
                    >
                      <span className='sr-only'>
                        Instagram
                      </span>
                      <svg
                        className='h-6 w-6'
                        fill='currentColor'
                        viewBox='0 0 24 24'
                        aria-hidden='true'
                      >
                        <path
                          fillRule='evenodd'
                          d='M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z'
                          clipRule='evenodd'
                        />
                      </svg>
                    </a>
                    {/* Twitter/X Icon */}
                    <a
                      href='#'
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-[var(--twitter)] hover:opacity-80 transition-opacity'
                      title='Twitter/X'
                    >
                      <span className='sr-only'>
                        Twitter
                      </span>
                      <svg
                        className='h-6 w-6'
                        fill='currentColor'
                        viewBox='0 0 24 24'
                        aria-hidden='true'
                      >
                        <path d='M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84' />
                      </svg>
                    </a>
                  </div>
                </div>

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

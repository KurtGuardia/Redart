'use client'

import { useState, useEffect } from 'react'
import { db } from '../../../lib/firebase-client'
import { doc, getDoc } from 'firebase/firestore'
import Image from 'next/image'
import Link from 'next/link'
import MapComponent from '../../../components/MapComponent'
import {
  FaWhatsapp,
  FaInstagram,
  FaFacebook,
} from 'react-icons/fa'
import {
  formatWhatsappNumber,
  generateGoogleMapsUrl,
} from '../../../lib/utils'

// Simple SVG Icon for location pin (defined locally)
const LocationPinIcon = () => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    className='h-5 w-5 inline-block mr-1 text-[var(--teal-700)]' // Adjusted color potentially
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

export default function VenueDetailFetcher({ venueId }) {
  const [venue, setVenueData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!venueId) {
      setError('Venue ID no proporcionado.')
      setLoading(false)
      return
    }

    const fetchData = async () => {
      setLoading(true)
      setError(null)
      setVenueData(null)

      try {
        // Fetch Venue Data
        const venueRef = doc(db, 'venues', venueId)
        const venueSnap = await getDoc(venueRef)

        if (!venueSnap.exists()) {
          setError('Lugar no encontrado.')
          setLoading(false)
          return
        }

        const rawVenueData = venueSnap.data()
        // Process venue data: Convert Timestamps and Location
        const processedVenueData = {
          id: venueSnap.id,
          ...rawVenueData,
          // Convert Timestamps
          createdAt: rawVenueData.createdAt?.toDate
            ? rawVenueData.createdAt.toDate().toISOString()
            : null,
          updatedAt: rawVenueData.updatedAt?.toDate
            ? rawVenueData.updatedAt.toDate().toISOString()
            : null,
          // Convert Location (assuming client data might have GeoPoint-like structure or {lat,lng})
          location: rawVenueData.location
            ? {
                latitude:
                  rawVenueData.location.latitude ??
                  rawVenueData.location._latitude ??
                  rawVenueData.location.lat ??
                  null,
                longitude:
                  rawVenueData.location.longitude ??
                  rawVenueData.location._longitude ??
                  rawVenueData.location.lng ??
                  null,
              }
            : null,
          photos: Array.isArray(rawVenueData.photos)
            ? rawVenueData.photos
            : [],
        }
        if (
          processedVenueData.location &&
          (processedVenueData.location.latitude === null ||
            processedVenueData.location.longitude === null)
        ) {
          processedVenueData.location = null
        }
        setVenueData(processedVenueData)
      } catch (err) {
        console.error(
          'Error fetching venue details client-side:',
          err,
        )
        setError(
          err.message || 'Error al cargar los datos.',
        )
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [venueId])

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex justify-center items-center'>
        <div className='animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-teal-500'></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex flex-col justify-center items-center text-center px-4'>
        <p className='text-red-500 text-xl mb-4'>
          Ocurrió un error:
        </p>
        <p className='text-red-400 mb-6'>{error}</p>
        <Link
          href='/'
          className='mt-4 inline-block bg-teal-500 text-white px-6 py-2 rounded-full'
        >
          Volver al inicio
        </Link>
      </div>
    )
  }

  if (!venue) {
    return (
      <div className='min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex justify-center items-center'>
        <p className='text-gray-400'>
          No se encontraron datos del lugar.
        </p>
      </div>
    )
  }

  const mapLocation =
    venue.location &&
    typeof venue.location.latitude === 'number' &&
    typeof venue.location.longitude === 'number'
      ? {
          id: venue.id,
          name: venue.name,
          latitude: venue.location.latitude,
          longitude: venue.location.longitude,
        }
      : null
  const mapCenter = mapLocation
    ? [mapLocation.latitude, mapLocation.longitude]
    : null

  return (
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
          {/* Use mapLocation and mapCenter derived earlier */}
          {mapLocation ? (
            <div className='h-80 md:h-96 w-full'>
              <MapComponent
                venues={[mapLocation]} // Pass location derived from venue
                center={mapCenter}
                zoom={16}
                isDashboard={true} // Keep or remove this prop based on MapComponent logic
                mapId={`venue-map-${venue.id}`} // Use unique ID
              />
            </div>
          ) : (
            <div className='h-80 md:h-96 w-full flex items-center justify-center bg-gray-100 text-gray-500 italic'>
              Ubicación no disponible en el mapa.
            </div>
          )}
          {venue.address && (
            <a
              href={generateGoogleMapsUrl({
                location: venue.location,
                address: venue.address,
                city: venue.city,
                country: venue.country,
              })}
              target='_blank'
              rel='noopener noreferrer'
              className='block text-center text-[var(--teal-800)] hover:text-[var(--teal-600)] hover:underline text-sm md:text-base mt-4'
            >
              <LocationPinIcon /> {venue.address}
            </a>
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
                width={150}
                height={100}
                style={{ objectFit: 'contain' }} // Use style prop for objectFit
                className='rounded-md'
              />
            </div>
          )}

          {/* Capacity */}
          {venue.capacity && (
            <div className='flex items-center gap-3'>
              <span className='text-2xl' title='Capacidad'>
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
          <div>
            <h3 className='font-semibold text-gray-700 mb-2 flex items-center gap-2'>
              <span className='text-xl'>✨</span> Servicios
            </h3>
            {/* Use renderAmenity helper if available and structure matches */}
            <ul className='list-none space-y-1 pl-8'>
              {/* Amenities */}
              {venue.amenities &&
                venue.amenities.length > 0 && (
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
                )}
            </ul>
          </div>

          {/* Social Media / WhatsApp Contact */}
          {(venue.facebookUrl ||
            venue.instagramUrl ||
            venue.whatsappNumber) && (
            <div>
              <h3 className='font-semibold text-gray-700 mb-2 flex items-center gap-2'>
                <span className='text-xl'>🌐</span> Contacto
                / Redes
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
                    <FaFacebook className='w-5 h-5' />{' '}
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
                    <FaInstagram className='w-5 h-5' />{' '}
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
                    <FaWhatsapp className='w-5 h-5' />{' '}
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
                venue.status === 'active'
                  ? 'bg-green-500'
                  : 'bg-red-500'
              }`}
            ></span>
            <span className='text-sm text-gray-600'>
              {venue.status === 'active'
                ? 'Activo'
                : 'Inactivo'}
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

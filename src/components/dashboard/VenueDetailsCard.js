'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import {
  FaFacebook,
  FaInstagram,
  FaRegEye,
  FaWhatsapp,
} from 'react-icons/fa'
import {
  formatTimestamp,
  formatWhatsappNumber,
} from '../../lib/utils' // Adjust path as needed
import { Skeleton } from '../ui/Skeleton'
import Image from 'next/image'

//
const MapComponent = dynamic(
  () => import('../map/MapComponent'),
  { ssr: false },
)

const getSafe = (fn, defaultValue = null) => {
  try {
    const result = fn()
    return result ?? defaultValue
  } catch (e) {
    return defaultValue
  }
}

export default function VenueDetailsCard({
  venue,
  onEdit,
}) {
  if (!venue) {
    return (
      <div className='bg-gray-50 rounded-lg shadow-lg p-6 flex flex-col items-center justify-center min-h-[350px]'>
        <span className='text-2xl font-bold text-teal-700 mb-8 animate-pulse bg-teal-100 px-6 py-3 rounded-lg shadow'>
          Cargando datos del lugar...
        </span>
        <Skeleton className='h-8 w-1/4 mb-4 bg-gray-300 animate-pulse' />
        <div className='flex items-center mb-4'>
          <Skeleton className='h-20 w-20 rounded-full mr-4 bg-gray-300 animate-pulse' />
          <Skeleton className='h-6 w-1/2 bg-gray-300 animate-pulse' />
        </div>
        <Skeleton className='h-60 w-full mb-4 bg-gray-300 animate-pulse' />
        <Skeleton className='h-4 w-full mb-2 bg-gray-300 animate-pulse' />
        <Skeleton className='h-4 w-3/4 mb-4 bg-gray-300 animate-pulse' />
        <Skeleton className='h-4 w-full mb-2 bg-gray-300 animate-pulse' />
        <Skeleton className='h-4 w-full mb-2 bg-gray-300 animate-pulse' />
        <Skeleton className='h-4 w-1/2 mb-4 bg-gray-300 animate-pulse' />
        <div className='grid grid-cols-3 gap-2 mt-4'>
          <Skeleton className='h-32 w-full bg-gray-300 rounded-lg animate-pulse' />
          <Skeleton className='h-32 w-full bg-gray-300 rounded-lg animate-pulse' />
          <Skeleton className='h-32 w-full bg-gray-300 rounded-lg animate-pulse' />
        </div>
      </div>
    )
  }

  // Robustly extract latitude and longitude from venue.location (Firestore GeoPoint)
  let latitude = null
  let longitude = null
  if (venue && venue.location) {
    if (
      typeof venue.location.latitude === 'number' &&
      typeof venue.location.longitude === 'number'
    ) {
      latitude = venue.location.latitude
      longitude = venue.location.longitude
    } else if (
      typeof venue.location._latitude === 'number' &&
      typeof venue.location._longitude === 'number'
    ) {
      latitude = venue.location._latitude
      longitude = venue.location._longitude
    }
  }
  const hasValidLocation =
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    !isNaN(latitude) &&
    !isNaN(longitude)

  return (
    <div className='bg-white rounded-lg shadow-lg p-6 h-fit'>
      {/* Header with Title and Edit Button */}
      <h2 className='text-2xl md:text-3xl 2xl:text-4xl font-semibold mb-4 text-gray-800 flex items-center justify-between'>
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
          className='text-base md:text-lg 2xl:text-xl text-teal-600 hover:text-teal-800 font-semibold'
          onClick={onEdit} // Use the passed prop from parent to open modal
          aria-label='Editar información del local'
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

      {/* Logo and Venue Name */}
      <div className='flex items-center mb-4'>
        <div className='flex items-center'>
          <Image
            src={venue.logo || './placeholder.svg'}
            alt={`Logo de ${venue.name || 'el local'}`}
            width={80}
            height={80}
            className='object-cover rounded-full border-2 border-teal-500 shadow-md mr-4'
          />
          <h3 className='text-xl md:text-2xl 2xl:text-3xl font-bold text-gray-800'>
            {venue.name || 'Establecimiento artistico'}
          </h3>
          {/* Ratings Display */}
          {Array.isArray(venue.ratings) &&
            venue.ratings.length > 0 && (
              <div className='flex items-center ml-4'>
                <span
                  className='text-yellow-500 text-lg'
                  title='Puntuación promedio'
                >
                  ⭐
                </span>
                <span className='ml-1 text-yellow-600 font-semibold text-base -mb-[5px]'>
                  {(
                    venue.ratings.reduce(
                      (sum, r) =>
                        sum +
                        (typeof r.score === 'number'
                          ? r.score
                          : 0),
                      0,
                    ) / venue.ratings.length
                  ).toFixed(1)}
                </span>
                <span className='ml-1 text-gray-500 text-xs -mb-[5px]'>
                  ({venue.ratings.length})
                </span>
              </div>
            )}
        </div>
      </div>

      {/* Map Display */}
      {hasValidLocation && (
        <div className='rounded-lg overflow-hidden mb-4 relative h-60 text-sm md:text-base 2xl:text-lg'>
          <MapComponent
            venues={[venue]} // Pass venue data in an array
            center={[latitude, longitude]}
            zoom={15}
            small={true}
            hideSearch={true}
            // disableUserLocation={true}
            mapId={`dashboard-map-${getSafe(
              () => venue.id,
              'venue', // Fallback ID part
            )}`} // Use safe access for venue.id
          />
        </div>
      )}

      {!hasValidLocation && (
        <div className='bg-gray-100 p-4 rounded-lg mb-4 text-center text-xs md:text-sm 2xl:text-base text-gray-500'>
          Ubicación no especificada. Edita el local para
          añadirla.
        </div>
      )}

      {/* Location Info Section */}
      {(venue.address || (venue.city && venue.country)) && (
        <div className='bg-gray-50 p-4 rounded-lg mb-4 text-sm md:text-base 2xl:text-lg'>
          <h3 className='text-lg md:text-xl 2xl:text-2xl font-semibold text-gray-700 mb-2'>
            <span>Ubicación</span>
          </h3>
          {venue.address && (
            <p className='text-xs md:text-sm 2xl:text-base text-gray-500 flex items-center gap-2 mb-2'>
              <svg
                /* Location Icon */ className='w-4 h-4 flex-shrink-0'
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
          )}
          {venue.city && venue.country && (
            <p className='text-xs md:text-sm 2xl:text-base text-gray-500 flex items-center gap-2'>
              <svg
                /* Globe Icon */ className='w-4 h-4 flex-shrink-0'
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
      )}

      {/* Description Section */}
      {venue.description && (
        <div className='bg-gray-50 p-4 rounded-lg mb-4 text-sm md:text-base 2xl:text-lg'>
          <h3 className='text-lg md:text-xl 2xl:text-2xl font-semibold text-gray-700 mb-2'>
            <span>Descripción</span>
          </h3>
          <p className='text-xs md:text-sm 2xl:text-base text-gray-500 flex items-start gap-2'>
            <svg
              /* Text/Info Icon */ className='w-4 h-4 mt-1 flex-shrink-0'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
              ></path>
            </svg>
            <span>{venue.description}</span>
          </p>
        </div>
      )}

      {/* Capacity Section */}
      {venue.capacity != null && ( // Check for null/undefined explicitly
        <div className='bg-gray-50 p-4 rounded-lg mb-4 text-sm md:text-base 2xl:text-lg'>
          <h3 className='text-lg md:text-xl 2xl:text-2xl font-semibold text-gray-700 mb-2'>
            <span>Capacidad</span>
          </h3>
          <p className='text-xs md:text-sm 2xl:text-base text-gray-500 flex items-center gap-2'>
            <svg
              /* Users Icon */ className='w-4 h-4 flex-shrink-0'
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
            {/* Conditional display based on capacity value */}
            {venue.capacity === 0 ||
            venue.capacity === 1 ? ( // Consider 0 or 1 as not specified effectively
              <span className='italic text-xs md:text-sm 2xl:text-base text-gray-400'>
                Capacidad no especificada
              </span>
            ) : (
              `${venue.capacity} personas`
            )}
          </p>
        </div>
      )}

      {/* Amenities Section */}
      {venue.amenities && venue.amenities.length > 0 && (
        <div className='bg-gray-50 p-4 rounded-lg mb-4 text-sm md:text-base 2xl:text-lg'>
          <h3 className='text-lg md:text-xl 2xl:text-2xl font-semibold text-gray-700 mb-2'>
            <span>Comodidades</span>
          </h3>
          <div className='flex flex-wrap gap-2'>
            {venue.amenities.map((amenity, index) => (
              <span
                key={index}
                className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs md:text-sm 2xl:text-base font-medium bg-teal-100 text-teal-800'
              >
                <svg
                  /* Check Icon */ className='w-3 h-3 mr-1 flex-shrink-0'
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
            ))}
          </div>
        </div>
      )}

      {/* Internal Contact Section */}
      {venue.email && (
        <div className='bg-gray-50 p-4 rounded-lg mb-4 text-sm md:text-base 2xl:text-lg'>
          <h3 className='text-lg md:text-xl 2xl:text-2xl font-semibold text-gray-700 mb-2'>
            <span>
              Contacto{' '}
              <small className='font-normal text-xs md:text-sm 2xl:text-base'>
                (sólo para Radart, no será visible hacia el
                público)
              </small>
            </span>
          </h3>
          <p className='text-xs md:text-sm 2xl:text-base text-gray-500 flex items-center gap-2'>
            <svg
              /* Mail Icon */ className='w-4 h-4 flex-shrink-0'
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

      {/* Social Media / WhatsApp Section */}
      {(venue.facebookUrl ||
        venue.instagramUrl ||
        venue.whatsappNumber) && (
        <div className='bg-gray-50 p-4 rounded-lg mb-4 text-sm md:text-base 2xl:text-lg'>
          <h3 className='text-lg md:text-xl 2xl:text-2xl font-semibold text-gray-700 mb-2'>
            <span>Redes Sociales / WhatsApp</span>
          </h3>
          <div className='space-y-2'>
            {venue.facebookUrl && (
              <p className='text-xs md:text-sm 2xl:text-base text-gray-500 flex items-center gap-2'>
                <a
                  href={venue.facebookUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='flex items-center gap-2 text-[var(--facebook)] hover:underline'
                  title={venue.facebookUrl}
                >
                  <FaFacebook className='w-5 h-5 flex-shrink-0' />
                  <span className='truncate'>Facebook</span>
                </a>
              </p>
            )}
            {venue.instagramUrl && (
              <p className='text-xs md:text-sm 2xl:text-base text-gray-500 flex items-center gap-2'>
                <a
                  href={venue.instagramUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='flex items-center gap-2 text-[var(--instagram)] hover:underline '
                  title={venue.instagramUrl}
                >
                  <FaInstagram className='w-5 h-5 flex-shrink-0' />
                  <span className='truncate'>
                    Instagram
                  </span>
                </a>
              </p>
            )}
            {venue.whatsappNumber && (
              <p className='text-xs md:text-sm 2xl:text-base text-gray-500 flex items-center gap-2'>
                <a
                  // Ensure only digits are used for the wa.me link for compatibility
                  href={`https://wa.me/${venue.whatsappNumber.replace(
                    /[^0-9]/g,
                    '',
                  )}`}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='flex items-center gap-2 text-[var(--whatsapp)] hover:underline'
                  title={`WhatsApp ${venue.whatsappNumber}`}
                >
                  <FaWhatsapp className='w-5 h-5 flex-shrink-0' />
                  <span className='truncate'>
                    WhatsApp{' '}
                    {formatWhatsappNumber(
                      // Display formatted number
                      venue.whatsappNumber,
                    )}
                  </span>
                </a>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Photos Gallery Section */}
      {venue.photos && venue.photos.length > 0 && (
        <div className='mt-4'>
          <h3 className='text-lg md:text-xl 2xl:text-2xl font-semibold text-gray-700 mb-2 ml-1 lg:ml-3'>
            Fotos
          </h3>
          <div className='flex flex-col gap-2'>
            {/* First row (up to 3 photos) */}
            <div className='grid grid-cols-3 gap-2'>
              {venue.photos
                .slice(0, 3)
                .map((photo, index) => (
                  <img
                    key={`photo-${index}`}
                    src={photo}
                    alt={`Foto ${index + 1} de ${getSafe(
                      () => venue.name,
                      'el local',
                    )}`}
                    className='w-full h-36 object-cover rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200'
                    loading='lazy'
                  />
                ))}
            </div>
            {/* Second row (photos 4 and 5) */}
            {venue.photos.length > 3 && (
              <div className='grid grid-cols-2 gap-2 mt-2'>
                {venue.photos
                  .slice(3, 5)
                  .map((photo, index) => (
                    <img
                      key={`photo-${index + 3}`}
                      src={photo}
                      alt={`Foto ${index + 4} de ${getSafe(
                        () => venue.name,
                        'el local',
                      )}`}
                      className='w-full h-36 object-cover rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200'
                      loading='lazy'
                    />
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Link to Public Venue Page */}
      {getSafe(() => venue.id) && ( // Only show link if venue ID exists
        <div className='mt-8 text-center'>
          {' '}
          {/* Consistent margin */}
          <Link
            href={`/venues/${venue.id}`}
            className='inline-flex items-center gap-2 justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[var(--blue-500)] hover:brightness-125 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary)] transition-all duration-200'
          >
            <span>Ver Página Pública del Local</span>
            <FaRegEye />
          </Link>
        </div>
      )}

      <p className='text-[var(--blue-500)] text-xs mt-6'>
        Parte de Radart desde:{' '}
        {formatTimestamp(venue.createdAt, {
          timeStyle: undefined,
        })}
      </p>
    </div>
  )
}

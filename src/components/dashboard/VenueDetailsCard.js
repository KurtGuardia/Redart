import React from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import {
  FaFacebook,
  FaInstagram,
  FaRegEye,
  FaWhatsapp,
} from 'react-icons/fa'
import { formatWhatsappNumber } from '../../lib/utils' // Adjust path as needed

// Dynamically import MapComponent only on the client-side
const MapComponent = dynamic(
  () => import('../../components/MapComponent'), // Adjust path as needed
  { ssr: false },
)

// Helper to safely access nested properties
const getSafe = (fn, defaultValue = null) => {
  try {
    // Make sure the function call result is checked for null/undefined before returning defaultValue
    const result = fn()
    return result ?? defaultValue
  } catch (e) {
    // Optional: Log the error for debugging if needed
    // console.error("Error accessing property:", e);
    return defaultValue
  }
}

export default function VenueDetailsCard({
  venue,
  onEdit, // Function to trigger the edit modal in the parent
}) {
  // Basic check if venue data is provided
  if (!venue) {
    return (
      <div className='bg-white rounded-lg shadow-lg p-6 animate-pulse'>
        {' '}
        {/* Added pulse animation for loading */}
        <div className='h-8 bg-gray-200 rounded w-1/4 mb-4'></div>
        <div className='h-20 w-20 bg-gray-200 rounded-full mr-4 mb-4 inline-block'></div>
        <div className='h-6 bg-gray-200 rounded w-1/2 mb-6 inline-block align-middle'></div>
        <div className='h-60 bg-gray-200 rounded mb-4'></div>
        <div className='h-4 bg-gray-200 rounded w-full mb-2'></div>
        <div className='h-4 bg-gray-200 rounded w-3/4 mb-4'></div>
        <div className='h-4 bg-gray-200 rounded w-full mb-2'></div>
        <div className='h-4 bg-gray-200 rounded w-full mb-2'></div>
        <div className='h-4 bg-gray-200 rounded w-1/2 mb-4'></div>
      </div>
    )
  }

  // Safely access latitude and longitude, providing 0 as a default
  const latitude = getSafe(() => venue.location.latitude, 0)
  const longitude = getSafe(
    () => venue.location.longitude,
    0,
  )
  // Consider a location valid if BOTH lat and lng are not 0 (or near 0 if that's possible for valid data)
  const hasValidLocation = latitude !== 0 || longitude !== 0

  return (
    <div className='bg-white rounded-lg shadow-lg p-6'>
      {/* Header with Title and Edit Button */}
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
      {venue.logo && (
        <div className='flex items-center mb-4'>
          <div className='flex items-center'>
            <img
              src={venue.logo}
              alt={`Logo de ${venue.name || 'el local'}`}
              className='w-20 h-20 object-cover rounded-full border-2 border-teal-500 shadow-md mr-4'
              loading='lazy'
            />
            <h3 className='text-xl font-bold text-gray-800'>
              {venue.name || 'Venue Name'}
            </h3>
          </div>
        </div>
      )}
      {!venue.logo &&
        venue.name && ( // Show name even if no logo
          <h3 className='text-xl font-bold text-gray-800 mb-4'>
            {venue.name}
          </h3>
        )}

      {/* Map Display */}
      {hasValidLocation && (
        <div className='rounded-lg overflow-hidden mb-4 relative h-60'>
          <MapComponent
            venues={[venue]} // Pass venue data in an array
            center={[latitude, longitude]}
            zoom={15}
            small={true}
            isDashboard={true}
            mapId={`dashboard-map-${getSafe(
              () => venue.id,
              'venue', // Fallback ID part
            )}`} // Use safe access for venue.id
          />
        </div>
      )}
      {!hasValidLocation && (
        <div className='bg-gray-100 p-4 rounded-lg mb-4 text-center text-gray-500'>
          Ubicación no especificada. Edita el local para
          añadirla.
        </div>
      )}

      {/* Location Info Section */}
      {(venue.address || (venue.city && venue.country)) && (
        <div className='bg-gray-50 p-4 rounded-lg mb-4'>
          <h3 className='font-semibold text-gray-700 mb-2'>
            <span>Ubicación</span>
          </h3>
          {venue.address && (
            <p className='text-sm text-gray-500 flex items-center gap-2 mb-2'>
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
            <p className='text-sm text-gray-500 flex items-center gap-2'>
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
        <div className='bg-gray-50 p-4 rounded-lg mb-4'>
          <h3 className='font-semibold text-gray-700 mb-2'>
            <span>Descripción</span>
          </h3>
          <p className='text-sm text-gray-500 flex items-start gap-2'>
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
        <div className='bg-gray-50 p-4 rounded-lg mb-4'>
          <h3 className='font-semibold text-gray-700 mb-2'>
            <span>Capacidad</span>
          </h3>
          <p className='text-sm text-gray-500 flex items-center gap-2'>
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
              <span className='italic text-gray-400'>
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
        <div className='bg-gray-50 p-4 rounded-lg mb-4'>
          <h3 className='font-semibold text-gray-700 mb-2'>
            <span>Comodidades</span>
          </h3>
          <div className='flex flex-wrap gap-2'>
            {venue.amenities.map((amenity, index) => (
              <span
                key={index}
                className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800'
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
        <div className='bg-gray-50 p-4 rounded-lg mb-4'>
          <h3 className='font-semibold text-gray-700 mb-2'>
            <span>
              Contacto{' '}
              <small className='font-normal'>
                (sólo para Radart, no será visible hacia el
                público)
              </small>
            </span>
          </h3>
          <p className='text-sm text-gray-500 flex items-center gap-2'>
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
        <div className='bg-gray-50 p-4 rounded-lg mb-4'>
          <h3 className='font-semibold text-gray-700 mb-2'>
            <span>Redes Sociales / WhatsApp</span>
          </h3>
          <div className='space-y-2'>
            {venue.facebookUrl && (
              <p className='text-sm text-gray-500 flex items-center gap-2'>
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
              <p className='text-sm text-gray-500 flex items-center gap-2'>
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
              <p className='text-sm text-gray-500 flex items-center gap-2'>
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
          <h3 className='font-semibold text-gray-700 mb-2'>
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
            target='_blank' // Open in new tab
            rel='noopener noreferrer' // Security best practice for target="_blank"
          >
            <span>Ver Página Pública del Local</span>
            <FaRegEye />
          </Link>
        </div>
      )}
    </div>
  )
}

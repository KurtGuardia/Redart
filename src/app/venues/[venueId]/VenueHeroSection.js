'use client'

import Image from 'next/image'
import Link from 'next/link' // Needed for the link wrapper potentially
import { useVenueData } from '../../../hooks/useVenueData'
import { generateGoogleMapsUrl } from '../../../lib/utils'
import { Skeleton } from '../../../components/ui/Skeleton' // Import Skeleton

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

export default function VenueHeroSection({ venueId }) {
  const { venue, loading, error } = useVenueData(venueId)

  // --- Throw error first if exists ---
  if (error) {
    throw error // Let error.js handle it
  }

  // --- Render Loading State ---
  if (loading) {
    // Render styled Skeleton
    return (
      <Skeleton className='relative w-full h-64 md:h-96 mb-12 shadow-lg bg-[var(--secondary-color-transparent)]' />
    )
  }

  // --- Render Empty State (if loading finished, no error, but no venue) ---
  if (!venue) {
    return (
      <div className='relative w-full h-64 md:h-96 flex items-center justify-center text-center overflow-hidden mb-12 shadow-lg bg-gray-800 text-gray-400'>
        No se encontraron datos del lugar.
      </div>
    )
  }

  // --- Calculate derived values ---
  const heroImageUrl =
    venue.photos && venue.photos.length > 0
      ? venue.photos[0]
      : null

  const { address, city, country, location } = venue
  // Use the utility function to generate the URL
  const googleMapsUrl = generateGoogleMapsUrl({
    location,
    address,
    city,
    country,
  })

  // --- Render Content using the provided JSX ---
  return (
    <div className='relative min-w-[80%]'>
      <div
        className={`relative w-full h-64 md:h-96 flex items-center justify-center text-center overflow-hidden mb-12
        shadow-lg`}
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
        <div className='relative z-20 p-4 text-white text-center'>
          <h1
            className='inline-block bg-[radial-gradient(var(--white),transparent)] p-8 rounded-full text-4xl
            md:text-6xl font-extrabold mb-4'
            style={{ textShadow: '-2px 3px 7px #000' }}
          >
            {venue.name}
          </h1>
          <div>
            <a
              href={googleMapsUrl}
              target='_blank'
              rel='noopener noreferrer'
              className='inline-block text-lg md:text-xl font-medium text-gray-200 hover:text-white hover:underline
              transition-colors duration-200'
            >
              <LocationPinIcon />
              {venue.address} - {venue.city},{' '}
              {venue.country}
            </a>
          </div>
        </div>
      </div>

      {venue.description && (
        <p className='mb-12 md:mb-16 border-b border-gray-200/80 rounded-xl bg-[var(--blue-800-transparent)] p-8 mx-12 whitespace-pre-wrap leading-relaxed text-2xl text-center text-white'>
          {venue.description}
        </p>
      )}
    </div>
  )
}

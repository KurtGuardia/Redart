'use client'

import Image from 'next/image'
import { useVenueData } from '../../hooks/useVenueData'
import { generateGoogleMapsUrl } from '../../lib/utils'
import { Skeleton } from '../ui/Skeleton'
import LocationPinIcon from '../LocationPinIcon'

export default function VenueHeroSection({ venueId }) {
  const { venue, loading, error } = useVenueData(venueId)

  if (error) {
    return (
      <div className='relative h-64 md:h-96 w-full flex items-center justify-center text-center mb-12 shadow-lg'>
        <div className='relative z-20 bg-white/10 w-[90%] backdrop-blur-md rounded-lg p-4 md:p-6 xl:px-14 2xl:px-20 shadow-lg'>
          <h2 className='text-2xl text-red-500 md:text-4xl font-bold mb-4'>
            Ocurrió un error
          </h2>
          <p className='text-md text-gray-400 md:text-lg mb-4'>
            {`No se pudo cargar la foto de portada y nombre 😞. Error: ${error.message}`}
          </p>
        </div>
        <div className='absolute inset-0 bg-gradient-to-br from-[var(--teal-700)] to-[var(--blue-800)] z-0'></div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className='relative min-w-[80%] animate-pulse'>
        <div className='relative w-full h-72 md:h-96 flex items-end justify-center text-center overflow-hidden mb-12 shadow-lg bg-white'>
          <div className='relative z-20 mb-8 p-4 md:mb-12'>
            <div className='bg-gray-400/30 backdrop-blur-md rounded-lg p-4 md:p-6 shadow-lg space-y-3'>
              <Skeleton className='h-8 md:h-12 w-64 md:w-72 mx-auto bg-gray-400/50' />
              <Skeleton className='h-5 md:h-6 w-60 md:w-80 mx-auto bg-gray-400/50' />
              <Skeleton className='h-5 md:h-6 w-60 md:w-80 mx-auto bg-gray-400/50' />
            </div>
          </div>
        </div>
        <Skeleton className='h-28 md:h-40 w-[80%] mx-auto mb-12 md:mb-16 rounded-xl bg-white p-8' />
      </div>
    )
  }

  if (!venue) {
    return (
      <div className='relative w-full h-64 md:h-96 flex items-center justify-center text-center overflow-hidden mb-12 shadow-lg bg-gray-800 text-gray-400'>
        No se encontraron datos del lugar.
      </div>
    )
  }

  const heroImageUrl =
    venue.photos && venue.photos.length > 0
      ? venue.photos[0]
      : null

  const { address, city, country, location } = venue

  const googleMapsUrl = generateGoogleMapsUrl({
    location,
    address,
    city,
    country,
  })

  return (
    <>
      <div
        className={`relative w-full md:h-[50vh] overflow-hidden flex items-center justify-center text-center mb-12 shadow-lg`}
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
            <div className='absolute inset-0 bg-gradient-to-t from-black/100 via-black/50 to-transparent z-10'></div>
          </>
        ) : (
          <div className='absolute inset-0 bg-gradient-to-br from-[var(--teal-700)] to-[var(--blue-800)] z-0'></div>
        )}
        <div className='relative z-20 bg-white/10 backdrop-blur-md rounded-lg p-4 md:p-6 xl:px-14 2xl:px-20 shadow-lg'>
          <h1 className='text-3xl md:text-5xl 2xl:text-7xl font-bold text-white mb-2'>
            {venue.name}
          </h1>
          <div>
            <a
              href={googleMapsUrl}
              target='_blank'
              rel='noopener noreferrer'
              className='inline-flex items-center text-md md:text-lg 2xl:text-xl font-medium text-gray-200 hover:underline transition-colors duration-200'
            >
              <LocationPinIcon />
              <span className='ml-1'>
                {venue.address} - {venue.city},{' '}
                {venue.country}
              </span>
            </a>
          </div>
        </div>
      </div>

      {venue.description && (
        <p className='mb-12 md:mb-16 border-b border-gray-200/80 rounded-xl bg-[var(--blue-800-transparent)] p-8 2xl:py-12 2xl:px-20 xl:max-w-[80%] mx-auto whitespace-pre-wrap leading-relaxed 2xl:leading-normal text-2xl 2xl:text-3xl text-center text-white'>
          {venue.description}
        </p>
      )}
    </>
  )
}

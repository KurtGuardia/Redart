import Link from 'next/link'
import Image from 'next/image'
import { useUserLocationDetection } from '../../hooks/useUserLocationDetection'
import { useEffect, useState } from 'react'
import { useVenueLocations } from '../../hooks/useVenueLocations'

export default function VenueList() {
  const [showLocationModal, setShowLocationModal] =
    useState(false)
  const [venueFilter, setVenueFilter] = useState(null)
  const [showPermissionModal, setShowPermissionModal] =
    useState(false)

  const {
    location: userCoords,
    locationDetails: userLocationDetails,
    loading: loadingUserLocation,
    error: userLocationError,
    permissionState,
    requestPermissionAndDetect,
  } = useUserLocationDetection()

  const {
    locations,
    loading: loadingVenues,
    error: venuesError,
  } = useVenueLocations(venueFilter)

  useEffect(() => {
    if (
      permissionState === 'granted' &&
      !loadingUserLocation &&
      userLocationDetails?.country_code
    ) {
      setVenueFilter({
        country: userLocationDetails.country_code,
      })
    } else {
      setVenueFilter(null)
    }

    if (
      permissionState === 'prompt' &&
      !loadingUserLocation &&
      !userLocationError
    ) {
      setShowLocationModal(true)
    } else {
      setShowLocationModal(false)
    }
  }, [
    permissionState,
    loadingUserLocation,
    userLocationDetails,
    userLocationError,
  ])

  if (!locations.length) {
    return (
      <div className='text-center text-gray-500 py-8'>
        No se encontraron espacios culturales en esta
        ubicación.
      </div>
    )
  }

  return (
    <div className='py-6'>
      <div className='bg-[var(--blue-800-transparent)] text-[var(--white)] p-2 mb-8 rounded-lg w-fit mx-auto text-sm'>
        Mostrando {locations.length}{' '}
        {locations.length === 1
          ? 'espacio cultural'
          : 'espacios culturales'}
      </div>
      <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'>
        {locations.map((venue) => (
          <div
            key={venue.id}
            className='bg-white rounded-xl shadow-lg p-4 flex flex-col items-center hover:shadow-2xl transition group relative border border-gray-100'
          >
            {venue.logo && (
              <div className='w-24 h-24 mb-3 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center'>
                <Image
                  src={venue.logo}
                  alt={`${venue.name} logo`}
                  width={96}
                  height={96}
                  className='object-contain w-full h-full'
                />
              </div>
            )}
            <Link
              href={`/venues/${venue.id}`}
              className='text-lg font-bold text-[var(--primary)] hover:underline text-center mb-1'
            >
              {venue.name}
            </Link>
            <div className='text-sm text-gray-700 text-center mb-1'>
              {venue.address}
            </div>
            <div className='text-xs text-gray-500 text-center mb-2'>
              {venue.city}, {venue.country}
            </div>
            {venue.description && (
              <div className='text-xs text-gray-600 line-clamp-3 text-center mb-2'>
                {venue.description}
              </div>
            )}
            {/* Optionally add more info, e.g., rating, tags, etc. */}
            <Link
              href={`/venues/${venue.id}`}
              className='mt-auto px-4 py-1 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 transition'
            >
              Ver detalles
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}

// Hay que hacer que muestre el mensaje de que es necesario dar ubicacion, y el boton de tooltip

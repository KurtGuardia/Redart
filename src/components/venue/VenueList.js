import Link from 'next/link'
import Image from 'next/image'
import { useUserLocationDetection } from '../../hooks/useUserLocationDetection'
import { useEffect, useState } from 'react'
import { useVenueLocations } from '../../hooks/useVenueLocations'
import { Skeleton } from '../ui/Skeleton'
import { useBrowserLocationInstructions } from '../../hooks/useBrowserLocationInstructions'
import DeniedLocationInstructions from '../DeniedLocationInstructions'
import Modal from '../ui/Modal'

export default function VenueList() {
  const [showLocationModal, setShowLocationModal] =
    useState(false)
  const [venueFilter, setVenueFilter] = useState(null)
  const [showPermissionModal, setShowPermissionModal] =
    useState(false)

  // Get browser instructions
  const { browser, instructions } =
    useBrowserLocationInstructions()

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
      (userLocationDetails?.city ||
        userLocationDetails?.country_code)
    ) {
      setVenueFilter({
        city: userLocationDetails.city,
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

  const isLoading =
    loadingUserLocation ||
    (permissionState === 'granted' && loadingVenues)

  if (isLoading) {
    return (
      <div className='py-6'>
        {/* Optional: Skeleton for the "Mostrando X espacios" text */}
        <Skeleton className='h-10 w-80 bg-gray-200 mb-8 rounded-lg mx-auto' />
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'>
          {/* Render multiple skeleton cards */}
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className='bg-white rounded-xl shadow-lg p-4 flex flex-col items-center border border-gray-100'
            >
              <Skeleton className='bg-gray-100 w-24 h-24 mb-3 rounded-md' />
              <Skeleton className='bg-gray-100 h-5 w-3/4 mb-2 rounded' />{' '}
              {/* Venue Name */}
              <Skeleton className='bg-gray-100 h-4 w-full mb-1 rounded' />{' '}
              {/* Address */}
              <Skeleton className='bg-gray-100 h-3 w-1/2 mb-2 rounded' />{' '}
              {/* City, Country */}
              <Skeleton className='bg-gray-100 h-3 w-full mb-1 rounded' />{' '}
              {/* Description line 1 */}
              <Skeleton className='bg-gray-100 h-3 w-full mb-1 rounded' />{' '}
              {/* Description line 2 */}
              <Skeleton className='bg-gray-100 h-3 w-5/6 mb-3 rounded' />{' '}
              {/* Description line 3 */}
              <Skeleton className='bg-gray-100 h-8 w-24 mt-auto rounded-lg' />{' '}
              {/* Button */}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Add the check for denied permission
  if (
    permissionState === 'denied' ||
    (userLocationError && permissionState !== 'granted')
  ) {
    return (
      <DeniedLocationInstructions
        showPermissionModal={showPermissionModal}
        setShowPermissionModal={setShowPermissionModal}
        browser={browser}
        instructions={instructions}
        userLocationError={userLocationError}
      />
    )
  }

  // Final JSX
  if (permissionState === 'granted') {
    if (venuesError) {
      return (
        <div className='text-center h-[60vh] flex flex-col justify-center items-center bg-gray-100 p-4'>
          <p className='text-red-600 mb-4'>
            Error al cargar los lugares:{' '}
            {venuesError.message}
          </p>
        </div>
      )
    }

    return (
      <div className='py-6 px-6 xl:px-0'>
        <div className='bg-[var(--blue-800-transparent)] text-[var(--white)] p-2 mb-8 rounded-lg w-fit mx-auto text-sm'>
          Mostrando {locations.length}{' '}
          {locations.length === 1
            ? 'espacio cultural'
            : 'espacios culturales'}{' '}
          cercanos a tu ubicación.
        </div>
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 2xl:grid-cols-4 gap-6 m-auto'>
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

  function handleAllowLocation() {
    setShowLocationModal(false)
    requestPermissionAndDetect()
  }

  function handleDenyLocation() {
    setShowLocationModal(false)
  }

  return (
    <div
      className={`mx-auto rounded-lg overflow-hidden flex flex-col justify-center items-center text-center h-[60vh] bg-gray-100 p-4 w-full`}
    >
      <Modal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onReject={handleDenyLocation}
        onAccept={handleAllowLocation}
        title='¿Permites acceso a tu ubicación?'
      >
        Para mostrarte los locales más cercanos, necesitamos
        acceder a tu ubicación.
        <br />
        <span className='font-semibold text-teal-700'>
          No almacenamos tu ubicación
        </span>
        , solo se usa para centrar el mapa.
        <br /> <br />
        ¿Deseas continuar?
      </Modal>
      <p className='text-2xl text-[var(--blue-800)] font-bold tracking-wider animate-bounce mb-4'>
        Esperando permiso de ubicación...
      </p>
    </div>
  )
}

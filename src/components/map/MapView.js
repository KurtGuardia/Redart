'use client'

import MapComponent from '../map/MapComponent'
import { useVenueLocations } from '../../hooks/useVenueLocations'
import { useUserLocationDetection } from '../../hooks/useUserLocationDetection'
import { Skeleton } from '../ui/Skeleton'
import { usePathname } from 'next/navigation'
import Modal from '../ui/Modal'
import { useState, useEffect, useMemo } from 'react' // Import useMemo

export default function MapView({ ...props }) {
  console.log('[MapView] Component rendering/re-rendering.')
  const pathname = usePathname()
  const [showLocationModal, setShowLocationModal] =
    useState(false)
  const isHomePage = pathname === '/'
  const DEFAULT_MAP_FILTER = {
    city: 'Cochabamba',
    country: 'BO',
  }
  const [venueFilter, setVenueFilter] = useState(
    DEFAULT_MAP_FILTER,
  )

  const {
    location: userCoords,
    locationDetails: userLocationDetails,
    loading: loadingUserLocation,
    error: userLocationError,
    permissionState,
    requestPermissionAndDetect,
  } = useUserLocationDetection()

  useEffect(() => {
    console.log(
      `[MapView] useEffect triggered. Dependencies: loadingUserLocation=${loadingUserLocation}, permissionState=${permissionState}, userLocationDetails=${JSON.stringify(
        userLocationDetails,
      )}, userLocationError=${userLocationError}`,
    )

    if (!loadingUserLocation) {
      console.log(
        '[MapView] useEffect: Location detection finished (loadingUserLocation is false).',
      )

      // --- New Logic: Prioritize Country Code ---
      if (userLocationDetails?.country_code) {
        console.log(
          '[MapView] useEffect: Found country code, setting filter.',
        )
        setVenueFilter({
          country: userLocationDetails.country_code, // Use country_code here
        })
        console.log(
          '[MapView] useEffect: Set venueFilter based on Country Code:',
          { country: userLocationDetails.country_code },
        )
      }
      // --- Logic for Denied/Error/No Details ---
      // Keep this logic to handle cases where location detection fails or is denied
      else if (
        permissionState === 'denied' ||
        userLocationError ||
        (!userLocationDetails &&
          permissionState === 'granted')
      ) {
        console.log(
          // Removed duplicate log message here
          '[MapView] useEffect: Location denied, error, or details unavailable. Setting venueFilter to null (will use default later if needed).',
        )
        setVenueFilter(null)
      } else if (permissionState === 'prompt') {
        console.log('HERE')

        console.log(
          '[MapView] useEffect: Permission state is prompt. Setting venueFilter to null.',
        )
        setVenueFilter(null)
      }
      // --- Fallback ---
      // This case might be less likely now but kept as a safety net
      else {
        console.log('HERE x2')

        console.log(
          '[MapView] useEffect: Fallback case. Setting venueFilter to DEFAULT_MAP_FILTER.',
        )
        setVenueFilter(DEFAULT_MAP_FILTER)
      }

      /* --- Commented Out: Original City + Country Logic ---
      if (
        userLocationDetails?.city &&
        userLocationDetails?.country_code // Check for country_code here too
      ) {
        console.log('[MapView] useEffect: Found city and country code.');
        setVenueFilter({
          city: userLocationDetails.city,
          country: userLocationDetails.country_code,
        });
        console.log('[MapView] useEffect: Set venueFilter based on City and Country:', { city: userLocationDetails.city, country: userLocationDetails.country_code });
      } else if (userLocationDetails?.country_code) { // Check for country_code only
        console.log('[MapView] useEffect: Found country code only.');
        setVenueFilter({
          country: userLocationDetails.country_code,
        });
        console.log('[MapView] useEffect: Set venueFilter based on Country only:', { country: userLocationDetails.country_code });
      }
      --- End Commented Out --- */

      // --- Modal Logic ---
      if (
        permissionState === 'prompt' &&
        !loadingUserLocation
      ) {
        setShowLocationModal(true)
        console.log(
          '[MapView] useEffect: Permission is prompt and not loading, showing location modal.',
        )
      } else {
        setShowLocationModal(false)
      }
    }
  }, [
    userLocationDetails,
    loadingUserLocation,
    permissionState,
    userLocationError,
  ])

  console.log(
    '[MapView] Current venueFilter state:',
    venueFilter,
  )

  const {
    locations,
    loading: loadingVenues,
    error: venuesError,
  } = useVenueLocations(venueFilter)
  console.log(locations)
  console.log(
    `[MapView] useVenueLocations hook state: loadingVenues=${loadingVenues}, venuesError=${venuesError}, locations count=${locations?.length}`,
  )

  const isLoading =
    // loadingUserLocation || // We might want to show the map with default filter while detecting
    venueFilter !== null && loadingVenues // Loading if detecting location OR if filter is set and venues are loading
  console.log(
    `[MapView] Calculated isLoading: ${isLoading}`,
  )

  // --- Calculate Map Center ---
  // Moved this hook call *before* the conditional returns
  console.log(
    `[MapView] Calculating mapCenter. Current userCoords: ${JSON.stringify(
      userCoords,
    )}, permissionState: ${permissionState}`,
  )
  // Use useMemo to stabilize the mapCenter value unless dependencies change
  const mapCenter = useMemo(() => {
    console.log(
      '[MapView] Recalculating mapCenter inside useMemo.',
    ) // Log when it actually recalculates
    return userCoords && // Ensure return statement is present
      typeof userCoords.lat === 'number' &&
      typeof userCoords.lng === 'number' &&
      permissionState === 'granted'
      ? [userCoords.lat, userCoords.lng]
      : [-17.389499, -66.156123]
  }, [userCoords, permissionState]) // Dependencies for useMemo

  if (userLocationError) {
    console.error(
      '[MapView] Rendering error boundary due to userLocationError:',
      userLocationError,
    )
    throw userLocationError
  }
  if (venuesError) {
    console.error(
      '[MapView] Rendering error boundary due to venuesError:',
      venuesError,
    )
    throw venuesError
  }

  if (isLoading) {
    return (
      <div className='flex flex-col gap-4 w-full max-w-4xl mx-auto bg-gray-100/50 rounded-xl shadow-md p-6 animate-pulse'>
        <div className='flex gap-2 mb-4'>
          <Skeleton className='h-10 w-full rounded-md bg-gray-300' />
          <Skeleton className='h-10 w-24 rounded-md bg-gray-300' />
        </div>
        <Skeleton className='w-full h-[350px] rounded-lg bg-gray-300' />
      </div>
    )
  }

  // Log the memoized value
  console.log(
    `[MapView] Calculated mapCenter: ${JSON.stringify(
      mapCenter,
    )} (Based on userCoords: ${JSON.stringify(
      userCoords,
    )}, permissionState: ${permissionState})`,
  )

  const handleAllowLocation = () => {
    console.log('[MapView] handleAllowLocation called.')
    setShowLocationModal(false)
    requestPermissionAndDetect()
  }

  const handleDenyLocation = () => {
    console.log('[MapView] handleDenyLocation called.')
    setShowLocationModal(false)
    // If user denies, ensure we fall back to the default filter so the map shows *something*
    if (!venueFilter) {
      setVenueFilter(DEFAULT_MAP_FILTER)
    }
  }

  return (
    <div
      className={`mx-auto rounded-lg overflow-hidden ${
        isHomePage ? 'w-[80%]' : 'w-full'
      }`}
    >
      <Modal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onReject={handleDenyLocation}
        onAccept={handleAllowLocation}
        title='¿Podemos acceder a tu ubicación?'
      >
        Para mostrarte los locales más cercanos y mejorar tu
        experiencia, necesitamos acceder a tu ubicación.{' '}
        <br />
        <span className='font-semibold text-teal-700'>
          No almacenamos tu ubicación
        </span>{' '}
        y solo se usa para centrar el mapa y mostrarte
        resultados relevantes.
        <br /> <br />
        ¿Deseas continuar?
      </Modal>

      {locations && locations.length > 0 ? ( // Check locations is defined too
        <>
          <MapComponent
            center={mapCenter}
            zoom={14}
            venues={locations}
            mapId='map-view-main'
            {...props}
          />
          {console.log(
            '[MapView] Rendering MapComponent with locations.',
          )}
        </>
      ) : (
        <div className='text-center h-[60vh] flex flex-col justify-center items-center bg-gray-100 p-4'>
          {console.log(
            '[MapView] Rendering placeholder: No locations to display.',
          )}
          <p className='text-gray-700 mb-4'>
            No hay lugares disponibles para mostrar en el
            mapa.
          </p>
        </div>
      )}
    </div>
  )
}

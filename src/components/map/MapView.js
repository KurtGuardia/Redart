'use client'

import { useState, useEffect, useMemo } from 'react'
import { useVenueLocations } from '../../hooks/useVenueLocations'
import { useUserLocationDetection } from '../../hooks/useUserLocationDetection'
import { useIsIndexPage } from '../../hooks/useIsIndexPage'
import MapComponent from '../map/MapComponent'
import { Skeleton } from '../ui/Skeleton'
import Modal from '../ui/Modal'
import { useBrowserLocationInstructions } from '../../hooks/useBrowserLocationInstructions'
import DeniedLocationInstructions from '../DeniedLocationInstructions'

export default function MapView({ ...props }) {
  const isHomePage = useIsIndexPage()
  const { browser, instructions } =
    useBrowserLocationInstructions()
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
      (userLocationDetails?.city ||
        userLocationDetails?.country_code)
    ) {
      setVenueFilter({
        city: userLocationDetails?.city,
        country: userLocationDetails?.country_code,
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

  const mapCenter = useMemo(() => {
    if (
      permissionState === 'granted' &&
      userCoords &&
      typeof userCoords.lat === 'number' &&
      typeof userCoords.lng === 'number'
    ) {
      return [userCoords.lat, userCoords.lng]
    }
    return null
  }, [userCoords, permissionState])

  function handleAllowLocation() {
    setShowLocationModal(false)
    requestPermissionAndDetect()
  }

  function handleDenyLocation() {
    setShowLocationModal(false)
  }

  if (isLoading) {
    return (
      <div className='flex flex-col gap-4 w-full mx-auto bg-gray-100/50 rounded-xl shadow-md p-6 animate-pulse'>
        <Skeleton className='w-full h-[60vh] rounded-lg bg-gray-300' />
      </div>
    )
  }

  // jsx rendered after user rejected the geolocation
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

  // After granting permission, the return here becomes the actual jsx in the browser
  if (permissionState === 'granted' && mapCenter) {
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
      <div
        className={`mx-auto rounded-lg overflow-hidden ${
          isHomePage ? 'w-[80%]' : 'w-full'
        }`}
      >
        {locations && locations.length > 0 ? (
          <MapComponent
            center={mapCenter}
            zoom={14}
            venues={locations}
            mapId='map-view-main'
            {...props}
          />
        ) : (
          <div className='text-center h-[60vh] flex flex-col justify-center items-center bg-gray-100 p-4'>
            <p className='text-gray-700 mb-4'>
              No se encontraron lugares cercanos en tu área.
            </p>
          </div>
        )}
      </div>
    )
  }

  // Return jsx by default, "Waiting for user approval..."
  return (
    <div
      className={`mx-auto rounded-lg overflow-hidden flex flex-col justify-center items-center text-center h-[60vh] bg-gray-100 p-4 ${
        isHomePage ? 'w-[80%]' : 'w-full'
      }`}
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

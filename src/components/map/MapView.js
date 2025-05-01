'use client'

import MapComponent from '../map/MapComponent'
import { useVenueLocations } from '../../hooks/useVenueLocations'
import { useUserLocationDetection } from '../../hooks/useUserLocationDetection'
import { Skeleton } from '../ui/Skeleton'
import { useIsIndexPage } from '../../hooks/useIsIndexPage'
import Modal from '../ui/Modal'
import { useState, useEffect, useMemo } from 'react'

export default function MapView({ ...props }) {
  const isHomePage = useIsIndexPage()
  const [showLocationModal, setShowLocationModal] =
    useState(false)
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

  // Set the venue filter based on the user location detection
  useEffect(() => {
    if (!loadingUserLocation) {
      if (userLocationDetails?.country_code) {
        setVenueFilter({
          country: userLocationDetails.country_code,
        })
      } else if (
        permissionState === 'denied' ||
        userLocationError ||
        (!userLocationDetails &&
          permissionState === 'granted') // Handle cases where location detection fails or is denied
      ) {
        setVenueFilter(null)
      } else if (permissionState === 'prompt') {
        setVenueFilter(null)
      }
      // --- Fallback ---
      // This case might be less likely now but kept as a safety net
      else {
        setVenueFilter(DEFAULT_MAP_FILTER)
      }

      if (
        permissionState === 'prompt' &&
        !loadingUserLocation
      ) {
        setShowLocationModal(true)
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

  // Brings the venue locations based on the filter just set before
  const {
    locations,
    loading: loadingVenues,
    error: venuesError,
  } = useVenueLocations(venueFilter)

  const isLoading = venueFilter !== null && loadingVenues

  // --- Calculate Map Center ---
  const mapCenter = useMemo(() => {
    return userCoords &&
      typeof userCoords.lat === 'number' &&
      typeof userCoords.lng === 'number' &&
      permissionState === 'granted'
      ? [userCoords.lat, userCoords.lng]
      : [-17.389499, -66.156123]
  }, [userCoords, permissionState])

  if (userLocationError) {
    throw userLocationError
  }
  if (venuesError) {
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

  const handleAllowLocation = () => {
    setShowLocationModal(false)
    requestPermissionAndDetect()
  }

  const handleDenyLocation = () => {
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

      {locations && locations.length > 0 ? (
        <>
          <MapComponent
            center={mapCenter}
            zoom={14}
            venues={locations}
            mapId='map-view-main'
            {...props}
          />
        </>
      ) : (
        <div className='text-center h-[60vh] flex flex-col justify-center items-center bg-gray-100 p-4'>
          <p className='text-gray-700 mb-4'>
            No hay lugares disponibles para mostrar en el
            mapa.
          </p>
        </div>
      )}
    </div>
  )
}

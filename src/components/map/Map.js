'use client'

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  useMap,
  Tooltip,
} from 'react-leaflet'
import { Icon } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAddressSearch } from '../../hooks/useAddressSearch'
import { FaSpinner } from 'react-icons/fa'
import Modal from '../ui/Modal'

const DEFAULT_CENTER = [-17.389499, -66.156123]
const DEFAULT_ZOOM = 13

const customIcon = new Icon({
  iconUrl:
    'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl:
    'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

// Updated component to handle map view updates for both single points and search results
function MapController({ searchResult, targetZoom = 16 }) {
  const map = useMap()

  useEffect(() => {
    if (
      searchResult &&
      typeof searchResult.lat === 'number' &&
      typeof searchResult.lng === 'number'
    ) {
      map.setView(
        [searchResult.lat, searchResult.lng],
        targetZoom,
      )
    }
  }, [searchResult, targetZoom, map])

  return null
}

function LocationMarker({ onLocationSelect }) {
  const [position, setPosition] = useState(null)

  // Create a useMapEvents hook to handle map click events
  useMapEvents({
    click(e) {
      const lat = Number(e.latlng.lat)
      const lng = Number(e.latlng.lng)

      // Validate coordinates and ensure they're proper numbers
      if (isNaN(lat) || isNaN(lng)) return

      // Set position as array for the marker
      setPosition([lat, lng])

      // Pass back location object with explicit lat/lng properties
      onLocationSelect({
        lat: lat,
        lng: lng,
        // Add these properties to ensure compatibility with different formats
        latitude: lat,
        longitude: lng,
      })
    },
  })

  // If position is set, show a marker at that position
  return position === null ? null : (
    <Marker position={position} icon={customIcon}>
      <Popup>Ubicación seleccionada</Popup>
    </Marker>
  )
}

// Component to set map view after coordinates are available
function InitialMapViewSetter({ center, zoom }) {
  const map = useMap()
  useEffect(() => {
    if (
      center &&
      center.length === 2 &&
      !isNaN(center[0]) &&
      !isNaN(center[1])
    ) {
      map.setView(center, zoom)
    }
  }, [center, zoom, map])
  return null
}

export default function Map({
  center,
  zoom = DEFAULT_ZOOM,
  venues = [],
  onLocationSelect = () => {},
  registrationAddress = '',
  registrationCity = '',
  isDashboard = false,
  mapId = 'map',
  isEditable = false,
}) {
  const router = useRouter()
  const [searchResult, setSearchResult] = useState(null)
  const [initialMapCenter, setInitialMapCenter] = useState(
    center || DEFAULT_CENTER,
  )
  const [loadingLocation, setLoadingLocation] =
    useState(true)
  const [userLocation, setUserLocation] = useState(null)
  const [locationError, setLocationError] = useState('')
  const [showLocationModal, setShowLocationModal] =
    useState(true)

  // IP-based location fetch
  const suggestionsRef = useRef(null)

  // Use the custom hook for address search logic
  const {
    searchQuery,
    handleInputChange,
    suggestions,
    showSuggestions,
    setShowSuggestions,
    handleSuggestionClick,
    handleSearchClick,
    isSearching,
    searchError,
  } = useAddressSearch(
    registrationAddress,
    registrationCity,
    (result) => {
      setSearchResult(result)
      if (onLocationSelect) {
        onLocationSelect({
          ...result,
          latitude: result.lat,
          longitude: result.lng,
        })
      }
    },
  )

  // Generate a unique map container ID if not provided
  const uniqueMapId = mapId
    ? mapId
    : `map-${Math.random().toString(36).substring(2, 9)}`

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener(
      'mousedown',
      handleClickOutside,
    )
    return () =>
      document.removeEventListener(
        'mousedown',
        handleClickOutside,
      )
  }, [setShowSuggestions])

  // Check geolocation permission on mount
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      navigator.permissions
    ) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((result) => {
          if (result.state === 'granted') {
            setShowLocationModal(false)
          }
        })
    }
  }, [])

  // Only run geolocation after user accepts
  useEffect(() => {
    if (!showLocationModal) {
      let didSet = false
      const ipinfoToken =
        process.env.NEXT_PUBLIC_IPINFO_TOKEN
      fetch(`https://ipinfo.io/json?token=${ipinfoToken}`)
        .then((res) => {
          if (!res.ok)
            throw new Error(
              'No se pudo obtener la ubicación por IP.',
            )
          return res.json()
        })
        .then((data) => {
          if (data.loc) {
            const [lat, lng] = data.loc
              .split(',')
              .map(Number)
            if (!didSet) {
              setInitialMapCenter([lat, lng])
              setUserLocation(data)
            }
          } else {
            setLocationError(
              'No se pudo determinar la ubicación aproximada por IP.',
            )
          }
        })
        .catch((error) => {
          setLocationError(
            'No se pudo determinar la ubicación aproximada por IP.',
          )
          console.error('IPinfo fetch error:', error)
        })
        .finally(() => {
          setLoadingLocation(false)
        })

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords
            setInitialMapCenter([latitude, longitude])
            // Reverse geocode with Mapbox to get country name/code
            const mapboxToken =
              process.env.NEXT_PUBLIC_MAPBOX_TOKEN
            fetch(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?types=country&access_token=${mapboxToken}`,
            )
              .then((res) => res.json())
              .then((data) => {
                const countryFeature =
                  data.features && data.features[0]
                const country = countryFeature?.text // e.g., 'Bolivia'
                const countryCode =
                  countryFeature?.properties?.short_code?.toUpperCase() // e.g., 'BO'
                setUserLocation((prev) => ({
                  ...prev,
                  latitude,
                  longitude,
                  lat: latitude,
                  lng: longitude,
                  country,
                  country_code: countryCode,
                }))
              })
              .catch(() => {
                // fallback: just update lat/lng
                setUserLocation((prev) => ({
                  ...prev,
                  latitude,
                  longitude,
                  lat: latitude,
                  lng: longitude,
                }))
              })
            didSet = true
          },
          (error) => {
            setLocationError(
              'No se pudo obtener la ubicación precisa del navegador.',
            )
            console.warn('Geolocation error:', error)
          },
          { enableHighAccuracy: true },
        )
      }
    }
  }, [showLocationModal])

  // Precise location (optional)
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const preciseLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }
          setInitialMapCenter([
            preciseLocation.lat,
            preciseLocation.lng,
          ])
          // Reverse geocode with Mapbox to get country name/code
          const mapboxToken =
            process.env.NEXT_PUBLIC_MAPBOX_TOKEN
          fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${preciseLocation.lng},${preciseLocation.lat}.json?types=country&access_token=${mapboxToken}`,
          )
            .then((res) => res.json())
            .then((data) => {
              const countryFeature =
                data.features && data.features[0]
              const country = countryFeature?.text
              const countryCode =
                countryFeature?.properties?.short_code?.toUpperCase()
              setUserLocation((prev) => ({
                ...prev,
                ...preciseLocation,
                country,
                country_code: countryCode,
              }))
            })
            .catch(() => {
              setUserLocation((prev) => ({
                ...prev,
                ...preciseLocation,
              }))
            })
        },
        (error) => {
          console.warn('Browser geolocation error:', error)
        },
        { enableHighAccuracy: true },
      )
    }
  }, [])

  // Restore simple initial zoom
  const initialMapZoom = zoom || DEFAULT_ZOOM

  // Improved function to safely extract position from venue
  const getValidPosition = (venue) => {
    // Initial check for a valid venue object
    if (!venue || typeof venue !== 'object') {
      console.warn(
        `Invalid venue object received in getValidPosition.`,
        venue,
      )
      return null
    }

    let lat, lng

    // Check various potential location structures:

    // 1. Nested location object (e.g., from older data or direct GeoPoint)
    if (
      venue.location &&
      typeof venue.location === 'object'
    ) {
      // Check for Firebase GeoPoint format
      if (
        typeof venue.location.latitude === 'number' &&
        typeof venue.location.longitude === 'number'
      ) {
        lat = venue.location.latitude
        lng = venue.location.longitude
      }
      // Check for object { lat, lng } format
      else if (
        venue.location.hasOwnProperty('lat') &&
        venue.location.hasOwnProperty('lng') &&
        typeof venue.location.lat === 'number' &&
        typeof venue.location.lng === 'number'
      ) {
        lat = venue.location.lat
        lng = venue.location.lng
      }
      // Check for simple array format [lat, lng]
      else if (
        Array.isArray(venue.location) &&
        venue.location.length === 2 &&
        typeof venue.location[0] === 'number' &&
        typeof venue.location[1] === 'number'
      ) {
        lat = venue.location[0] // Assuming [lat, lng] order
        lng = venue.location[1]
      }
    }

    // 2. Top-level latitude/longitude properties (from our refactored service)
    // Only check this if lat/lng haven't already been found in venue.location
    if (lat === undefined && lng === undefined) {
      if (
        typeof venue.latitude === 'number' &&
        typeof venue.longitude === 'number'
      ) {
        lat = venue.latitude
        lng = venue.longitude
      }
    }

    // Validate the final derived coordinates
    if (
      lat === undefined ||
      lng === undefined ||
      isNaN(lat) ||
      isNaN(lng)
      // Consider if you need to validate bounds, e.g., lat between -90 and 90
    ) {
      console.warn(
        `Invalid or missing coordinates derived for venue ${
          venue.id || '(no id)'
        }. Original venue data:`,
        venue,
        `Derived: lat=${lat}, lng=${lng}`,
      )
      return null
    }

    // Always return consistent [lat, lng] array format for Leaflet
    return [lat, lng]
  }

  return (
    <div className='flex flex-col gap-4 h-full'>
      <Modal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
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
        <br />
        <br />
        ¿Deseas continuar?
      </Modal>
      {!isDashboard && (
        <div className='relative' ref={suggestionsRef}>
          <div className='flex gap-2'>
            <div className='relative flex-grow'>
              <input
                type='text'
                value={searchQuery}
                onChange={handleInputChange}
                onFocus={() => setShowSuggestions(true)}
                placeholder='Busca una ubicación...'
                className='w-full px-3 py-2 pr-8 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-teal-500'
                disabled={isSearching}
              />
              {searchQuery && (
                <button
                  type='button'
                  onClick={() => {
                    handleInputChange({
                      target: { value: '' },
                    })
                    setShowSuggestions(false)
                  }}
                  className='absolute inset-y-0 right-0 flex items-center px-2 text-gray-500 hover:text-gray-700 focus:outline-none'
                  aria-label='Limpiar búsqueda'
                >
                  <svg
                    className='w-5 h-5'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                    xmlns='http://www.w3.org/2000/svg'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M6 18L18 6M6 6l12 12'
                    />
                  </svg>
                </button>
              )}
            </div>
            <button
              type='button'
              onClick={handleSearchClick}
              className='px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition duration-300 disabled:opacity-50'
              disabled={isSearching}
            >
              {isSearching ? 'Buscando...' : 'Buscar'}
            </button>
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <div className='absolute z-[1010] w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto'>
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  type='button'
                  className='w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none'
                  onClick={() =>
                    handleSuggestionClick(suggestion)
                  }
                >
                  <div className='font-medium'>
                    {suggestion.text}
                  </div>
                  <div className='text-sm text-gray-600'>
                    {suggestion.place_name}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {searchError && (
        <div className='text-red-500 text-sm'>
          {searchError}
        </div>
      )}

      <div
        id={uniqueMapId}
        className={`w-full h-[60vh] mx-auto map-container relative`}
      >
        {loadingLocation && (
          <div className='absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/80'>
            <FaSpinner className='animate-spin text-3xl text-teal-600 mb-2' />
            <span className='text-teal-800 font-medium'>
              Detectando ubicación...
            </span>
          </div>
        )}
        {locationError && !loadingLocation && (
          <div className='absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/80'>
            <span className='text-red-600 font-semibold'>
              {locationError}
            </span>
          </div>
        )}
        <MapContainer
          center={initialMapCenter}
          zoom={initialMapZoom}
          style={{
            height: '100%',
            width: '100%',
            borderRadius: '15px',
          }}
          scrollWheelZoom={true}
        >
          <InitialMapViewSetter
            center={initialMapCenter}
            zoom={zoom || DEFAULT_ZOOM}
          />
          <TileLayer
            url='https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          />

          {venues &&
            venues.length > 0 &&
            venues
              .filter((venue) => {
                const venuePosition =
                  getValidPosition(venue)
                if (!venuePosition || !userLocation)
                  return false
                const match =
                  venue.country === userLocation.country ||
                  venue.country ===
                    userLocation.country_code
                if (!match) {
                  console.log('Venue filtered out:', {
                    venueCountry: venue.country,
                    userCountry: userLocation.country,
                    userCountryCode:
                      userLocation.country_code,
                    venue,
                  })
                }
                return match
              })
              .map((venue) => {
                const position = getValidPosition(venue)
                const venueName = venue.name || 'Sin nombre'
                return (
                  <Marker
                    key={venue.id || venueName}
                    position={position}
                    icon={customIcon}
                    eventHandlers={{
                      click: () => {
                        if (venue.id) {
                          router.push(`/venues/${venue.id}`)
                        }
                      },
                    }}
                  >
                    {venueName && (
                      <Tooltip
                        direction='top'
                        offset={[0, -41]}
                        permanent
                        className='leaflet-tooltip-always font-bold bg-white text-black border border-gray-400 rounded px-2 py-1 shadow'
                      >
                        {venueName}
                      </Tooltip>
                    )}
                  </Marker>
                )
              })}

          {isEditable && (
            <LocationMarker
              onLocationSelect={onLocationSelect}
            />
          )}
          <MapController searchResult={searchResult} />
        </MapContainer>
      </div>
    </div>
  )
}

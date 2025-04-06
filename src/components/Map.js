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
import { useAddressSearch } from '../hooks/useAddressSearch'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
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

  // Restore simple initial center logic
  const initialMapCenter = center || DEFAULT_CENTER
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
      {!isDashboard && (
        <div className='relative' ref={suggestionsRef}>
          <div className='flex gap-2'>
            <input
              type='text'
              value={searchQuery}
              onChange={handleInputChange}
              onFocus={() => setShowSuggestions(true)}
              placeholder='Busca una ubicación...'
              className='flex-grow px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500'
              disabled={isSearching}
            />
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
        className={`w-full h-[60vh] mx-auto map-container`}
      >
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
          <TileLayer
            url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
            attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          />

          {venues &&
            venues.length > 0 &&
            venues
              .filter(
                (venue) => getValidPosition(venue) !== null,
              )
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
                      >
                        <div className='text-center'>
                          <div className='font-bold'>
                            {venueName}
                          </div>
                          {venue.address && (
                            <div className='text-xs'>
                              {venue.address}
                            </div>
                          )}
                        </div>
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

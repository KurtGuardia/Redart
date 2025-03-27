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

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

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

// New component to handle map center updates
function MapController({ searchResult }) {
  const map = useMap()

  if (searchResult) {
    map.setView([searchResult.lat, searchResult.lng], 16)
  }

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
  zoom = 13,
  venues = [],
  onLocationSelect = () => {},
  registrationAddress = '',
  registrationCity = '',
  isDashboard = false,
  small = false,
  mapId = 'map',
  isEditable = false,
}) {
  const router = useRouter()
  const [address, setAddress] = useState(
    registrationAddress,
  )
  const [city, setCity] = useState(registrationCity)
  const [searchError, setSearchError] = useState('')
  const [searchResult, setSearchResult] = useState(null)
  const [isSearching, setIsSearching] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] =
    useState(false)
  const suggestionsRef = useRef(null)
  const mapRef = useRef(null) // Reference to track if map is initialized

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
  }, [])

  // Set address and city from registration
  useEffect(() => {
    // Construct search query - if we have both, combine them
    const addressToSet = registrationAddress || ''
    const searchQuery =
      addressToSet +
      (registrationCity ? `, ${registrationCity}` : '')

    setAddress(searchQuery)
    setCity(registrationCity)
  }, [registrationAddress, registrationCity])

  // Fetch suggestions as user types
  const fetchSuggestions = async (input) => {
    if (!input.trim()) {
      setSuggestions([])
      return
    }

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          input,
        )}.json?access_token=${MAPBOX_TOKEN}&types=address,place,locality,neighborhood&limit=5`,
      )

      if (!response.ok)
        throw new Error('Failed to fetch suggestions')

      const data = await response.json()
      setSuggestions(data.features)
    } catch (error) {
      setSuggestions([])
    }
  }

  // Handle input change with debouncing
  const handleInputChange = (e) => {
    const value = e.target.value
    setAddress(value)
    setShowSuggestions(true)

    // Debounce suggestions fetch
    const timeoutId = setTimeout(() => {
      fetchSuggestions(value)
    }, 300)

    return () => clearTimeout(timeoutId)
  }

  // Handle suggestion selection
  const handleSuggestionClick = async (suggestion) => {
    const [lng, lat] = suggestion.center
    const result = { lat, lng }

    setAddress(suggestion.place_name)
    setSearchResult(result)
    onLocationSelect(result)
    setShowSuggestions(false)
    setSuggestions([])
  }

  const handleSearchClick = async () => {
    if (!address.trim()) return

    setIsSearching(true)
    setSearchError('')

    try {
      const encodedAddress = encodeURIComponent(address)
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${MAPBOX_TOKEN}&limit=1`,
      )

      if (!response.ok) {
        throw new Error('Failed to fetch address')
      }

      const data = await response.json()

      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center
        const result = { lat, lng }
        setSearchResult(result)
        onLocationSelect(result)
        setSearchError('')
      } else {
        setSearchError(
          'No se encontraron resultados para esta dirección',
        )
      }
    } catch (error) {
      setSearchError(
        'Error al buscar la dirección. Por favor, intente nuevamente.',
      )
    } finally {
      setIsSearching(false)
    }
  }

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      // Clean up any leaflet-related elements
      const mapContainer =
        document.getElementById(uniqueMapId)
      if (mapContainer) {
        // Clear any references or state
        mapRef.current = null
      }
    }
  }, [uniqueMapId])

  // Improved check for valid center coordinates
  const validCenter = (() => {
    // Default center coordinates (Bolivia)
    const defaultCenter = [-17.389499, -66.156123]

    // Check if center is valid
    if (!center) return defaultCenter
    if (!Array.isArray(center)) return defaultCenter
    if (center.length !== 2) return defaultCenter
    if (!center[0] || !center[1]) return defaultCenter
    if (
      isNaN(Number(center[0])) ||
      isNaN(Number(center[1]))
    )
      return defaultCenter

    return center
  })()

  // Improved function to safely extract position from venue
  const getValidPosition = (venue) => {
    if (!venue || !venue.location) return null

    // Try to get coordinates from different possible formats
    let lat, lng

    // Extract latitude value
    if (
      typeof venue.location.latitude !== 'undefined' &&
      venue.location.latitude !== null
    ) {
      lat = Number(venue.location.latitude)
    } else if (
      typeof venue.location.lat !== 'undefined' &&
      venue.location.lat !== null
    ) {
      lat = Number(venue.location.lat)
    }

    // Extract longitude value
    if (
      typeof venue.location.longitude !== 'undefined' &&
      venue.location.longitude !== null
    ) {
      lng = Number(venue.location.longitude)
    } else if (
      typeof venue.location.lng !== 'undefined' &&
      venue.location.lng !== null
    ) {
      lng = Number(venue.location.lng)
    }

    // Validate the coordinates - strictly check for valid geographic coordinates
    if (lat === undefined || lng === undefined) return null
    if (isNaN(lat) || isNaN(lng)) return null
    if (lat === 0 || lng === 0) return null // Reject any zero values as they're likely default/unset values

    return [lat, lng]
  }

  return (
    <div className='flex flex-col gap-4 h-full'>
      {!isDashboard && (
        <div className='relative' ref={suggestionsRef}>
          <div className='flex gap-2'>
            <input
              type='text'
              value={address}
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

          {/* Suggestions dropdown */}
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
        className={`w-full ${
          small ? 'h-[350px]' : 'h-[60vh]'
        } mx-auto map-container`}
      >
        <MapContainer
          center={validCenter}
          zoom={zoom}
          style={{
            height: '100%',
            width: '100%',
            borderRadius: '15px',
          }}
          scrollWheelZoom={true}
          id={uniqueMapId}
          key={uniqueMapId} // This forces re-render when ID changes
        >
          <TileLayer
            url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
            attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          />

          {/* Only render LocationMarker if the map is editable */}
          {isEditable && (
            <LocationMarker
              onLocationSelect={onLocationSelect}
            />
          )}

          <MapController searchResult={searchResult} />

          {venues
            // Apply strict filtering before mapping to components
            .filter((venue) => {
              // Get valid position using our helper function
              const position = getValidPosition(venue)

              // Only include venues with non-null position arrays that have valid numeric coordinates
              return (
                Array.isArray(position) &&
                position.length === 2 &&
                typeof position[0] === 'number' &&
                typeof position[1] === 'number' &&
                position[0] !== 0 &&
                position[1] !== 0 &&
                !isNaN(position[0]) &&
                !isNaN(position[1])
              )
            })
            .map((venue, index) => {
              // We already validated this position is valid in the filter step
              const position = getValidPosition(venue)

              // Venue name with fallback
              const venueName = venue.name || 'Sin nombre'

              // Return the marker component
              return (
                <Marker
                  key={`venue-marker-${index}-${
                    venue.id || index
                  }`}
                  position={position}
                  icon={customIcon}
                  eventHandlers={{
                    click: () => {
                      if (
                        venue.id &&
                        !isDashboard &&
                        !small
                      ) {
                        router.push(`/venues/${venue.id}`)
                      }
                    },
                  }}
                >
                  {/* Tooltip with venue information */}
                  <Tooltip
                    direction='top'
                    offset={[0, -10]}
                    opacity={0.9}
                    permanent={false}
                  >
                    <div className='text-center'>
                      <div className='text-sm font-bold'>
                        {venueName}
                      </div>
                      {venue.address && (
                        <div className='text-xs text-gray-600'>
                          {venue.address}
                        </div>
                      )}
                      {venue.city && venue.country && (
                        <div className='text-xs text-gray-600'>
                          {venue.city}, {venue.country}
                        </div>
                      )}
                    </div>
                  </Tooltip>
                </Marker>
              )
            })}
        </MapContainer>
      </div>
    </div>
  )
}

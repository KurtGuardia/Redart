import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  useMap,
} from 'react-leaflet'
import { Icon } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useState, useRef, useEffect } from 'react'

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
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng
      onLocationSelect({ lat, lng })
    },
  })

  return null
}

export default function Map({
  center,
  zoom = 13,
  venues = [],
  onLocationSelect = () => {},
  registrationAddress = '',
  registrationCity = '',
}) {
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
    setAddress(registrationAddress)
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
      console.error('Error fetching suggestions:', error)
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
      console.error('Search error:', error)
      setSearchError(
        'Error al buscar la dirección. Por favor, intente nuevamente.',
      )
    } finally {
      setIsSearching(false)
    }
  }

  if (
    !center ||
    !Array.isArray(center) ||
    center.length !== 2
  ) {
    console.error('Invalid center prop provided to Map')
    return null
  }

  return (
    <div className='flex flex-col gap-4 h-full'>
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

      {searchError && (
        <div className='text-red-500 text-sm'>
          {searchError}
        </div>
      )}

      <div className='w-full h-[60vh] mx-auto map-container'>
        <MapContainer
          center={center}
          zoom={zoom}
          style={{
            height: '100%',
            width: '100%',
            borderRadius: '15px',
          }}
          scrollWheelZoom={false}
        >
          <TileLayer
            url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
            attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          />
          <LocationMarker
            onLocationSelect={onLocationSelect}
          />
          <MapController searchResult={searchResult} />

          {venues.map((venue, index) => (
            <Marker
              key={index}
              position={[
                venue?.geopoint?.lat || center[0],
                venue?.geopoint?.lng || center[1],
              ]}
              icon={customIcon}
            >
              <Popup>
                <div className='font-semibold'>
                  {venue.displayName || 'Unknown User'}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  )
}

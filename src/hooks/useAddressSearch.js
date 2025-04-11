import { useState, useEffect, useCallback } from 'react'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
const DEBOUNCE_DELAY = 300 // Define debounce delay as a constant
const MAPBOX_GEOCODING_API_BASE =
  'https://api.mapbox.com/geocoding/v5/mapbox.places'

export function useAddressSearch(
  initialAddress = '',
  initialCity = '',
  onSearchResult = () => {}, // Callback when a search result is found
) {
  // Combine initial address and city for the input state
  const initialQuery =
    initialAddress + (initialCity ? `, ${initialCity}` : '')
  const [searchQuery, setSearchQuery] =
    useState(initialQuery)
  const [searchError, setSearchError] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] =
    useState(false)
  const [debounceTimeout, setDebounceTimeout] =
    useState(null)

  // Update search query if initial props change
  useEffect(() => {
    const newQuery =
      initialAddress +
      (initialCity ? `, ${initialCity}` : '')
    setSearchQuery(newQuery)
  }, [initialAddress, initialCity])

  // Fetch suggestions
  const fetchSuggestions = useCallback(async (input) => {
    if (!input.trim()) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    try {
      const response = await fetch(
        `${MAPBOX_GEOCODING_API_BASE}/${encodeURIComponent(
          input,
        )}.json?access_token=${MAPBOX_TOKEN}&types=address,place,locality,neighborhood&limit=5`,
      )

      if (!response.ok)
        throw new Error('Failed to fetch suggestions')

      const data = await response.json()
      setSuggestions(data.features || []) // Ensure suggestions is always an array
      setShowSuggestions(true) // Show suggestions when they are fetched
    } catch (error) {
      console.error('Suggestion fetch error:', error)
      setSuggestions([])
      setShowSuggestions(false) // Hide on error
    }
  }, [])

  // Handle input change with debouncing
  const handleInputChange = useCallback(
    (e) => {
      const value = e.target.value
      setSearchQuery(value)
      setShowSuggestions(true) // Show suggestions on input change

      if (debounceTimeout) {
        clearTimeout(debounceTimeout)
      }

      const newTimeout = setTimeout(() => {
        fetchSuggestions(value)
      }, DEBOUNCE_DELAY)
      setDebounceTimeout(newTimeout)
    },
    [debounceTimeout, fetchSuggestions],
  )

  // Handle suggestion selection
  const handleSuggestionClick = useCallback(
    (suggestion) => {
      const [lng, lat] = suggestion.center
      const result = { lat, lng }

      setSearchQuery(suggestion.place_name) // Update input field with full place name
      onSearchResult(result) // Pass result to the parent component
      setShowSuggestions(false)
      setSuggestions([]) // Clear suggestions
    },
    [onSearchResult],
  )

  // Handle manual search button click
  const handleSearchClick = useCallback(async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    setSearchError('')
    setShowSuggestions(false) // Hide suggestions during manual search

    try {
      const encodedAddress = encodeURIComponent(searchQuery)
      const response = await fetch(
        `${MAPBOX_GEOCODING_API_BASE}/${encodedAddress}.json?access_token=${MAPBOX_TOKEN}&limit=1`,
      )

      if (!response.ok) {
        throw new Error('Failed to fetch address')
      }

      const data = await response.json()

      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center
        const result = { lat, lng }
        onSearchResult(result) // Pass result to the parent component
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
  }, [searchQuery, onSearchResult])

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout)
      }
    }
  }, [debounceTimeout])

  return {
    searchQuery,
    handleInputChange,
    suggestions,
    showSuggestions,
    setShowSuggestions, // Expose this to allow closing from parent (e.g., on outside click)
    handleSuggestionClick,
    handleSearchClick,
    isSearching,
    searchError,
  }
}

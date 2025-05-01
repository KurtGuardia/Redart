import { useState, useEffect, useCallback } from 'react'

async function fetchLocationDetails(lat, lng) {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  if (!mapboxToken || isNaN(lat) || isNaN(lng)) {
    return { city: null, country: null, country_code: null } // Handle missing token or invalid coords
  }

  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?types=country,place,locality&access_token=${mapboxToken}`,
    )
    if (!response.ok)
      throw new Error('Mapbox API request failed')
    const data = await response.json()

    const countryFeature = data.features.find((f) =>
      f.place_type.includes('country'),
    )
    const cityFeature = data.features.find(
      (f) =>
        f.place_type.includes('place') ||
        f.place_type.includes('locality'),
    )

    return {
      city: cityFeature?.text || null,
      country: countryFeature?.text || null,
      country_code:
        countryFeature?.properties?.short_code?.toUpperCase() ||
        null,
    }
  } catch (error) {
    // Consider logging to a monitoring service
    return { city: null, country: null, country_code: null }
  }
}

export function useUserLocationDetection() {
  const [location, setLocation] = useState(null)
  const [locationDetails, setLocationDetails] =
    useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [permissionState, setPermissionState] =
    useState('prompt')

  const detectLocation = useCallback(async () => {
    setLoading(true)
    setError(null)
    let locationFound = false

    // --- 1. Try Browser Geolocation (if permission granted or prompt) ---
    if (
      navigator.geolocation &&
      (permissionState === 'granted' ||
        permissionState === 'prompt')
    ) {
      try {
        const position = await new Promise(
          (resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
              resolve,
              reject,
              {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
              },
            )
          },
        )

        const { latitude, longitude } = position.coords
        const coords = {
          lat: latitude,
          lng: longitude,
          latitude,
          longitude,
        }
        const details = await fetchLocationDetails(
          latitude,
          longitude,
        )
        setLocation(coords) // Update coords
        setLocationDetails(details)
        setPermissionState('granted')
        setError(null)
        locationFound = true
      } catch (geoError) {
        if (geoError.code === geoError.PERMISSION_DENIED) {
          setError(
            'Permiso de ubicación denegado por el navegador.',
          )
          setPermissionState('denied')
        } else {
          // Keep previous error null or set a generic one, fallback to IP
          setError(
            'No se pudo obtener la ubicación precisa del navegador.',
          ) // Keep error state lean
        }
        // Don't set locationFound = true, proceed to IP fallback
      }
    } else if (
      navigator.geolocation &&
      permissionState === 'denied'
    ) {
      setError(
        'Permiso de ubicación denegado por el navegador.',
      )
    } else if (!navigator.geolocation) {
    }
    // --- 2. Try IP Geolocation (if browser failed or wasn't tried) ---
    if (!locationFound && permissionState !== 'denied') {
      const ipinfoToken =
        process.env.NEXT_PUBLIC_IPINFO_TOKEN
      if (ipinfoToken) {
        try {
          const response = await fetch(
            // Only try IP if browser failed AND permission wasn't explicitly denied
            `https://ipinfo.io/json?token=${ipinfoToken}`,
          )
          if (!response.ok)
            throw new Error('IPInfo request failed')
          const data = await response.json()

          if (data.loc) {
            const [lat, lng] = data.loc
              .split(',')
              .map(Number)
            if (!isNaN(lat) && !isNaN(lng)) {
              const coords = {
                lat,
                lng,
                latitude: lat,
                longitude: lng,
              }
              const details = await fetchLocationDetails(
                lat,
                lng,
              )
              setLocation(coords) // Set location even if browser failed
              setLocationDetails(details)
              setError(null) // Clear previous browser error if IP succeeds
              locationFound = true
            } else {
              throw new Error(
                'Invalid coordinates from IPInfo',
              )
            }
          } else {
            throw new Error(
              'No location data in IPInfo response',
            )
          }
        } catch (ipError) {
          // Consider logging to a monitoring service
          if (!error && permissionState !== 'denied') {
            setError(
              'No se pudo determinar la ubicación aproximada.',
            )
          }
        }
      } else {
        if (!error && permissionState !== 'denied') {
          setError(
            'No se pudo determinar la ubicación aproximada (configuración).',
          )
        }
      }
    }
    setLoading(false)

    // If still no location found after all attempts
    if (
      !locationFound &&
      !error &&
      permissionState !== 'denied'
    ) {
      setError('No se pudo determinar la ubicación.')
    }
  }, [permissionState, error])

  // Effect to check initial permission state
  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !navigator.permissions
    ) {
      return
    }
    navigator.permissions
      .query({ name: 'geolocation' }) // Check initial permission
      .then((result) => {
        const initialState = result.state
        setPermissionState(initialState)
        // Trigger initial detection if allowed or prompt
        if (
          initialState === 'granted' ||
          initialState === 'prompt'
        ) {
          detectLocation()
        }
      })
      .catch((error) => {
        // Consider logging to a monitoring service
      })
  }, []) // Runs only once on mount

  // Effect to trigger detection when permission becomes granted or on initial load (if not denied/disabled)
  useEffect(() => {
    // NOTE: Initial detection is handled by the first useEffect.
    // Subsequent detections after explicit permission grant are handled by requestPermissionAndDetect.
    // This effect primarily ensures loading state is correct if permission changes to denied externally.
    if (permissionState === 'denied') {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permissionState, loading]) // detectLocation removed as it's stable via useCallback

  // Function to be called explicitly by UI if user grants permission via a modal
  const requestPermissionAndDetect = () => {
    if (navigator.geolocation) {
      setLoading(true) // Show loading indicator while browser prompt is potentially up
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          // Success: This means permission was granted
          setPermissionState('granted') // Update state
          const { latitude, longitude } = position.coords
          const coords = {
            lat: latitude,
            lng: longitude,
            latitude,
            longitude,
          }
          const details = await fetchLocationDetails(
            latitude,
            longitude,
          )
          setLocation(coords)
          setLocationDetails(details)
          setError(null)
          setLoading(false)
        },
        (geoError) => {
          // Failure: Permission likely denied via browser prompt
          setPermissionState('denied')
          setError(
            'Permiso de ubicación denegado por el navegador.',
          )
          setLoading(false)
          // Optionally try IP fallback again here if desired, but might be redundant
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        },
      )
    } else {
      setError(
        'Geolocalización no soportada por este navegador.',
      )
      setLoading(false)
    }
  }

  return {
    location,
    locationDetails,
    loading,
    error,
    permissionState,
    requestPermissionAndDetect,
  }
}

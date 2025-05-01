import { useState, useEffect, useCallback } from 'react'

async function fetchLocationDetails(lat, lng) {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  if (!mapboxToken || isNaN(lat) || isNaN(lng)) {
    console.warn(
      'Mapbox token missing or invalid coordinates for reverse geocoding.',
    )
    return { city: null, country: null, country_code: null }
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
    console.error('Error during reverse geocoding:', error)
    return { city: null, country: null, country_code: null }
  }
}

export function useUserLocationDetection() {
  console.log('[useUserLocationDetection] Hook initialized')
  const [location, setLocation] = useState(null)
  const [locationDetails, setLocationDetails] =
    useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [permissionState, setPermissionState] =
    useState('prompt')

  const detectLocation = useCallback(async () => {
    console.log(
      `[useUserLocationDetection] detectLocation called. Current permissionState: ${permissionState}`,
    )
    setLoading(true)
    setError(null)
    let locationFound = false
    console.log(navigator)
    console.log(navigator.geolocation)
    console.log(navigator.permissions)

    // --- 1. Try Browser Geolocation (if permission granted or prompt) ---
    if (
      navigator.geolocation &&
      (permissionState === 'granted' ||
        permissionState === 'prompt')
    ) {
      console.log(
        '[useUserLocationDetection] Attempting Browser Geolocation...',
      )
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
        setLocation(coords)
        const details = await fetchLocationDetails(
          latitude,
          longitude,
        )
        setLocationDetails(details)
        setPermissionState('granted')
        setError(null)
        console.log(
          '[useUserLocationDetection] Browser Geolocation SUCCESS:',
          coords,
          details,
        )
        locationFound = true
        // Note: setLoading(false) happens at the end of detectLocation
      } catch (geoError) {
        console.warn('Browser Geolocation error:', geoError)
        if (geoError.code === geoError.PERMISSION_DENIED) {
          setError(
            'Permiso de ubicación denegado por el navegador.',
          )
          setPermissionState('denied')
          console.log(
            '[useUserLocationDetection] Browser Geolocation FAILED: Permission Denied.',
          )
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
      console.log(
        '[useUserLocationDetection] Browser Geolocation skipped: Permission already denied.',
      )
      setError(
        'Permiso de ubicación denegado por el navegador.',
      )
    } else if (!navigator.geolocation) {
      console.log(
        '[useUserLocationDetection] Browser Geolocation skipped: Not supported.',
      )
      console.warn('Browser Geolocation not supported.')
      // Proceed to IP fallback
    }

    // --- 2. Try IP Geolocation (if browser failed or wasn't tried) ---
    if (!locationFound && permissionState !== 'denied') {
      // Only try IP if browser failed AND permission wasn't explicitly denied
      console.log(
        '[useUserLocationDetection] Attempting IP Geolocation...',
      )
      const ipinfoToken =
        process.env.NEXT_PUBLIC_IPINFO_TOKEN
      if (ipinfoToken) {
        try {
          console.log(
            '[useUserLocationDetection] Using IPInfo token.',
          )
          const response = await fetch(
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
              setLocation(coords) // Set location even if browser failed
              const details = await fetchLocationDetails(
                lat,
                lng,
              )
              setLocationDetails(details)
              setError(null) // Clear previous browser error if IP succeeds
              locationFound = true
              console.log(
                '[useUserLocationDetection] IP Geolocation SUCCESS:',
                coords,
                details,
              )
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
          console.error('IP Geolocation error:', ipError)
          console.log(
            '[useUserLocationDetection] IP Geolocation FAILED.',
          )
          // Only set error if browser didn't already set one, or be more specific
          if (!error && permissionState !== 'denied') {
            setError(
              'No se pudo determinar la ubicación aproximada.',
            )
          }
        }
      } else {
        console.warn('IPInfo token missing.')
        console.log(
          '[useUserLocationDetection] IP Geolocation skipped: Token missing.',
        )
        if (!error && permissionState !== 'denied') {
          setError(
            'No se pudo determinar la ubicación aproximada (configuración).',
          )
        }
      }
    }

    console.log(
      `[useUserLocationDetection] detectLocation finished. Location found: ${locationFound}, Error: ${error}`,
    )
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
    console.log(
      '[useUserLocationDetection] useEffect: Checking initial permission state...',
    )
    if (
      typeof window === 'undefined' ||
      !navigator.permissions
    ) {
      console.log(
        '[useUserLocationDetection] useEffect: Permissions API not available, defaulting state to prompt.',
      )
      return
    }
    navigator.permissions
      .query({ name: 'geolocation' }) // Check initial permission
      .then((result) => {
        setPermissionState(result.state) // 'granted', 'prompt', or 'denied'
        const initialState = result.state
        setPermissionState(initialState) // Update state
        console.log(
          '[useUserLocationDetection] useEffect: Initial permission state from Permissions API:',
          initialState,
        )
        // --- ADDED: Trigger initial detection if allowed ---
        if (
          initialState === 'granted' ||
          initialState === 'prompt'
        ) {
          console.log(
            '[useUserLocationDetection] useEffect: Triggering initial detection based on permission state.',
          )
          detectLocation()
        }
      })
      .catch((error) => {
        console.error(
          '[useUserLocationDetection] useEffect: Error checking initial permission state:',
          error,
        )
      })
  }, []) // Runs only once on mount

  // Function to be called explicitly by UI if user grants permission via a modal
  const requestPermissionAndDetect = () => {
    console.log(
      `[useUserLocationDetection] requestPermissionAndDetect called. Current permissionState: ${permissionState}`,
    )
    if (permissionState === 'granted') return // No need if already granted

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
          setLocation(coords)
          const details = await fetchLocationDetails(
            latitude,
            longitude,
          )
          setLocationDetails(details)
          setError(null)
          console.log(
            '[useUserLocationDetection] requestPermissionAndDetect: Browser prompt SUCCESS.',
            coords,
            details,
          )
          setLoading(false)
        },
        (geoError) => {
          // Failure: Permission likely denied via browser prompt
          console.warn(
            'Browser Geolocation error on request:',
            geoError,
          )
          setPermissionState('denied')
          setError(
            'Permiso de ubicación denegado por el navegador.',
          )
          console.log(
            '[useUserLocationDetection] requestPermissionAndDetect: Browser prompt FAILED (Permission Denied).',
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
      console.error(
        '[useUserLocationDetection] requestPermissionAndDetect: navigator.geolocation is not available.',
      )
      setError(
        'Geolocalización no soportada por este navegador.',
      )
      setLoading(false)
    }
  }

  console.log(
    `[useUserLocationDetection] Returning state: loading=${loading}, permissionState=${permissionState}, location=${JSON.stringify(
      location,
    )}, error=${error}`,
  )
  return {
    location,
    locationDetails,
    loading,
    error,
    permissionState,
    requestPermissionAndDetect,
  }
}

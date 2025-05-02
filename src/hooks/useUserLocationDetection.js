import { useState, useEffect, useCallback } from 'react'

async function fetchLocationDetails(lat, lng) {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  if (!mapboxToken || isNaN(lat) || isNaN(lng)) {
    // Return specific details even on failure for consistent structure
    return { city: null, country: null, country_code: null }
  }

  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?types=country,place,locality&access_token=${mapboxToken}`,
    )
    if (!response.ok) {
      console.error(
        'Mapbox API request failed:',
        response.status,
      )
      throw new Error('Mapbox API request failed')
    }
    const data = await response.json()
    const countryFeature = data.features.find((f) =>
      f.place_type.includes('country'),
    )
    const cityFeature = data.features.find((f) =>
      f.place_type.includes('place'),
    )
    return {
      city: cityFeature?.text || null,
      country: countryFeature?.text || null,
      country_code:
        countryFeature?.properties?.short_code?.toUpperCase() ||
        null,
    }
  } catch (error) {
    console.error('Error fetching location details:', error) // Log error
    // Return specific details even on failure for consistent structure
    return { city: null, country: null, country_code: null }
  }
}

export function useUserLocationDetection() {
  const [location, setLocation] = useState(null)
  const [locationDetails, setLocationDetails] =
    useState(null)
  const [loading, setLoading] = useState(true) // Start loading until permission is checked
  const [error, setError] = useState(null)
  const [permissionState, setPermissionState] =
    useState(null) // Initial state null until checked

  const detectLocation = useCallback(
    async (isInitialDetection = false) => {
      // Prevent execution if permission is already known to be denied
      if (permissionState === 'denied') {
        setLoading(false) // Ensure loading stops if we somehow enter here while denied
        setError(
          'Permiso de ubicación denegado por el navegador.',
        ) // Ensure error is set
        return
      }

      setLoading(true)
      setError(null) // Clear previous errors on new attempt
      let locationFound = false
      let browserDenied = false // Flag to track explicit browser denial

      // --- 1. Try Browser Geolocation (Only if permission allows) ---
      // Check permission *before* attempting geolocation
      if (
        navigator.geolocation &&
        (permissionState === 'granted' ||
          isInitialDetection)
      ) {
        try {
          const position = await new Promise(
            (resolve, reject) => {
              navigator.geolocation.getCurrentPosition(
                resolve,
                reject,
                {
                  enableHighAccuracy: true, // Prefer accuracy
                  timeout: 8000, // Reduced timeout
                  maximumAge: 60000, // Allow cached position for 1 min
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
          // Fetch details *only* if coords are valid
          if (!isNaN(latitude) && !isNaN(longitude)) {
            const details = await fetchLocationDetails(
              latitude,
              longitude,
            )
            setLocation(coords)
            setLocationDetails(details)
            setPermissionState('granted') // Confirmed granted
            setError(null) // Clear any previous errors
            locationFound = true
          } else {
            // Should not happen with getCurrentPosition, but good practice
            throw new Error(
              'Invalid coordinates received from browser',
            )
          }
        } catch (geoError) {
          if (
            geoError.code === geoError.PERMISSION_DENIED
          ) {
            setError(
              'Permiso de ubicación denegado por el navegador.',
            )
            setPermissionState('denied')
            browserDenied = true // Set flag: User explicitly denied via browser
          } else if (
            geoError.code === geoError.POSITION_UNAVAILABLE
          ) {
            setError(
              'Ubicación no disponible en este momento.',
            )
          } else if (geoError.code === geoError.TIMEOUT) {
            setError(
              'Tiempo de espera agotado al obtener la ubicación del navegador.',
            )
          } else {
            setError(
              'Error al obtener la ubicación del navegador.',
            ) // Generic browser error
          }
          // Don't set locationFound = true, proceed to IP fallback *unless* denied
        }
      } else if (
        navigator.geolocation &&
        permissionState === 'denied'
      ) {
        // If state was already denied, ensure error message is set
        setError(
          'Permiso de ubicación denegado por el navegador.',
        )
        browserDenied = true // Ensure flag is set if we reach here
      } else if (!navigator.geolocation) {
        // Browser doesn't support Geolocation API
        setError(
          'Geolocalización no soportada por este navegador.',
        )
        // Proceed to IP fallback
      }

      // --- 2. Try IP Geolocation (Fallback IF browser didn't succeed AND permission wasn't explicitly denied) ---
      // Only fallback if no location found yet AND the user didn't explicitly deny in the browser step
      if (!locationFound && !browserDenied) {
        const ipinfoToken =
          process.env.NEXT_PUBLIC_IPINFO_TOKEN
        if (ipinfoToken) {
          try {
            const response = await fetch(
              `https://ipinfo.io/json?token=${ipinfoToken}`,
            )
            if (!response.ok) {
              console.error(
                'IPInfo request failed:',
                response.status,
              )
              throw new Error('IPInfo request failed')
            }
            const data = await response.json()

            if (data.loc) {
              const [latStr, lngStr] = data.loc.split(',')
              const lat = Number(latStr)
              const lng = Number(lngStr)

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

                // Set location/details ONLY if browser didn't deny.
                // If browser failed for other reasons (timeout, unavailable), IP is a valid fallback.
                if (permissionState !== 'denied') {
                  setLocation(coords)
                  setLocationDetails(details)
                  // Don't change permissionState here; it remains 'prompt' or what it was if browser failed non-critically
                  setError(null) // Clear previous browser error if IP succeeds
                  locationFound = true
                }
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
            console.error('IP Geolocation Error:', ipError) // Log IP error
            // Set error only if no specific browser error occurred before and permission isn't denied
            if (!error && permissionState !== 'denied') {
              setError(
                'No se pudo determinar la ubicación aproximada (IP).',
              )
            }
          }
        } else {
          // IPInfo token missing
          if (!error && permissionState !== 'denied') {
            setError(
              'Configuración incompleta para ubicación por IP.',
            )
          }
        }
      }

      // --- Final State Update ---
      setLoading(false)

      // If still no location found AND permission isn't denied, set a final generic error
      if (
        !locationFound &&
        permissionState !== 'denied' &&
        !error
      ) {
        setError('No se pudo determinar la ubicación.')
      }
    },
    [permissionState, error],
  )

  // Effect to check initial permission state ONCE on mount
  useEffect(() => {
    let isMounted = true // Prevent state update on unmounted component
    if (
      typeof window !== 'undefined' &&
      navigator.permissions
    ) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((result) => {
          if (isMounted) {
            const initialState = result.state
            setPermissionState(initialState) // Set initial state ('granted', 'prompt', or 'denied')

            // Automatically detect ONLY if already granted
            if (initialState === 'granted') {
              detectLocation(true) // Pass flag indicating initial detection attempt
            } else {
              // If 'prompt' or 'denied', stop loading, wait for user interaction or explicit call
              setLoading(false)
              if (initialState === 'denied') {
                setError(
                  'Permiso de ubicación denegado por el navegador.',
                )
              }
            }

            // Listen for changes in permission state
            result.onchange = () => {
              if (isMounted) {
                setPermissionState(result.state)
                // Optional: Automatically detect if changed TO granted?
                // if (result.state === 'granted') {
                //    detectLocation();
                // }
                if (
                  result.state === 'denied' &&
                  permissionState !== 'denied'
                ) {
                  setLocation(null) // Clear location if permission revoked
                  setLocationDetails(null)
                  setError(
                    'Permiso de ubicación denegado por el navegador.',
                  )
                  setLoading(false) // Ensure loading stops
                }
              }
            }
          }
        })
        .catch((permError) => {
          if (isMounted) {
            console.error(
              'Error checking/watching permission:',
              permError,
            )
            setError(
              'No se pudo verificar el permiso de ubicación.',
            )
            setLoading(false) // Stop loading on permission check error
          }
        })
    } else {
      // Permissions API or window not available (SSR or old browser)
      setError('API de permisos no disponible.') // Or handle differently? Maybe try IP directly?
      setLoading(false)
    }

    return () => {
      isMounted = false // Cleanup on unmount
      // Potentially remove the onchange listener if needed, though it might auto-clean
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Function to be called explicitly by UI (e.g., button click)
  const requestPermissionAndDetect =
    useCallback(async () => {
      if (!navigator.geolocation) {
        setError(
          'Geolocalización no soportada por este navegador.',
        )
        setLoading(false)
        return
      }

      setLoading(true) //
      setError(null)
      setPermissionState('prompt')

      try {
        // Check permission status FIRST before triggering prompt
        if (navigator.permissions) {
          const permissionResult =
            await navigator.permissions.query({
              name: 'geolocation',
            })
          setPermissionState(permissionResult.state)

          if (permissionResult.state === 'denied') {
            setError(
              'Permiso de ubicación denegado por el navegador.',
            )
            setLoading(false)
            setLocation(null)
            setLocationDetails(null)
            return
          }
        }
      } catch (permError) {
        console.error(
          'Error verificando permiso antes de pedir ubicación:',
          permError,
        )
        // Continue anyway; fallback to direct prompt if Permissions API fails
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          if (!isNaN(latitude) && !isNaN(longitude)) {
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
            setPermissionState('granted')
            setError(null)
          } else {
            setError('Coordenadas inválidas recibidas.')
          }
          setLoading(false)
        },
        (geoError) => {
          if (
            geoError.code === geoError.PERMISSION_DENIED
          ) {
            setError(
              'Permiso de ubicación denegado por el navegador.',
            )
            setPermissionState('denied')
            setLocation(null)
            setLocationDetails(null)
          } else if (
            geoError.code === geoError.POSITION_UNAVAILABLE
          ) {
            setError(
              'Ubicación no disponible en este momento.',
            )
          } else if (geoError.code === geoError.TIMEOUT) {
            setError(
              'Tiempo de espera agotado al obtener la ubicación.',
            )
          } else {
            setError('Error al solicitar la ubicación.')
          }
          setLoading(false)
        },
        {
          maximumAge: 0,
        },
      )
    }, [])

  return {
    location,
    locationDetails,
    loading,
    error,
    permissionState,
    requestPermissionAndDetect,
  }
}

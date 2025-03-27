import { useState, useEffect } from 'react'
import { db } from '../lib/firebase-client'
import {
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore'

/**
 * Helper function to validate if a venue has valid coordinates
 */
function hasValidCoordinates(venue) {
  if (!venue || !venue.location) return false

  // Check latitude
  const hasValidLat =
    typeof venue.location.latitude === 'number' &&
    !isNaN(venue.location.latitude) &&
    venue.location.latitude !== 0

  // Check longitude
  const hasValidLng =
    typeof venue.location.longitude === 'number' &&
    !isNaN(venue.location.longitude) &&
    venue.location.longitude !== 0

  return hasValidLat && hasValidLng
}

export function useVenueLocations(showInactive = false) {
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchLocations() {
      try {
        setLoading(true)

        // Build the query based on the showInactive flag
        let locationsQuery
        if (!showInactive) {
          locationsQuery = query(
            collection(db, 'venues_locations'),
            where('active', '==', true),
          )
        } else {
          locationsQuery = collection(
            db,
            'venues_locations',
          )
        }

        const snapshot = await getDocs(locationsQuery)

        // Map documents to venue objects and filter out those without valid coordinates
        const venueLocations = snapshot.docs
          .map((doc) => {
            const data = doc.data()
            return {
              id: data.venueId || doc.id, // Use venueId field or fallback to document ID
              name: data.name,
              address: data.address,
              location: data.location,
              logo: data.logo || null,
              city: data.city,
              country: data.country,
              active: data.active,
            }
          })
          .filter(hasValidCoordinates)

        setLocations(venueLocations)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchLocations()
  }, [showInactive])

  return { locations, loading, error }
}

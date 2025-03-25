import { useState, useEffect } from 'react'
import { db } from '../lib/firebase-client'
import {
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore'

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

        const venueLocations = snapshot.docs.map((doc) => {
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

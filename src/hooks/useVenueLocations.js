import { useState, useEffect } from 'react'
import { db } from '../lib/firebase-client'
import {
  collection,
  query,
  where,
  getDocs,
  limit,
} from 'firebase/firestore'

const DEFAULT_FILTER = {
  city: 'Cochabamba',
  country: 'BO',
}

export function useVenueLocations(
  filterParams = {},
  fetchAll = false,
) {
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      setLocations([])

      try {
        const venuesCollection = collection(db, 'venues')
        let q

        // Determine if we have valid filter parameters
        const hasCity = filterParams?.city
        const hasCountryCode = filterParams?.country
        const useFilter =
          !fetchAll && (hasCity || hasCountryCode)

        if (useFilter) {
          if (hasCountryCode) {
            q = query(
              venuesCollection,
              where('country', '==', filterParams.country),
              // where('active', '==', true),
              limit(100),
            )
            // --- Commented out City Filter (kept for reference) ---
            /* else if (hasCity) {
            // This block is less likely to be used now but kept for reference
            q = query(
              venuesCollection,
              where('city', '==', filterParams.city),
              where(
                'country',
                '==',
                filterParams.country || DEFAULT_FILTER.country, // Ensure country matches if city is specific
              ),
              // where('active', '==', true),
              limit(100),
            )
          } */
            // If filterParams exist but lack city/country, maybe use default or fetch all?
            // Using default filter for this example:
          } else {
            // If filterParams exist but lack city/country, maybe use default or fetch all?
            // Using default filter for this example:
            q = query(venuesCollection, limit(100)) // Fallback to limit if no valid filter
          }
        } else {
          q = query(
            venuesCollection,
            limit(100), // IMPORTANT: Limit results when fetching all client-side
          )
        }

        const querySnapshot = await getDocs(q)
        const fetchedLocations = querySnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
            location: doc.data().location
              ? {
                  latitude:
                    doc.data().location.latitude ??
                    doc.data().location._latitude ??
                    doc.data().location.lat ??
                    null,
                  longitude:
                    doc.data().location.longitude ??
                    doc.data().location._longitude ??
                    doc.data().location.lng ??
                    null,
                }
              : null,
          }))
          .filter(
            (venue) =>
              venue.location &&
              venue.location.latitude !== null &&
              venue.location.longitude !== null,
          ) // Ensure location is valid after fetch

        setLocations(fetchedLocations)
      } catch (err) {
        // Consider logging to a monitoring service instead of console
        setError(
          err instanceof Error
            ? err
            : new Error('Failed to fetch venues'),
        )
      } finally {
        setLoading(false)
      }
    }

    if (
      fetchAll ||
      (filterParams && Object.keys(filterParams).length > 0)
    ) {
      fetchData()
    } else if (
      !filterParams ||
      Object.keys(filterParams).length === 0
    ) {
      // If no filters and not fetching all, set loading false and show empty state
      setLoading(false)
      setLocations([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterParams?.city, filterParams?.country, fetchAll])

  return { locations, loading, error }
}

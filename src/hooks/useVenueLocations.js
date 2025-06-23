import { useState, useEffect } from 'react'
import { db } from '../lib/firebase-client'
import {
  collection,
  query,
  where,
  getDocs,
  limit,
} from 'firebase/firestore'

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
          if (hasCity) {
            q = query(
              venuesCollection,
              where('city', '==', filterParams.city),
              // where('active', '==', true),
              limit(100),
            )
          } else if (!hasCity && hasCountryCode) {
            q = query(
              venuesCollection,
              where('country', '==', filterParams.country),
              // where('active', '==', true),
              limit(100),
            )
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

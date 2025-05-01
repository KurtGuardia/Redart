import { useState, useEffect } from 'react'
import { db } from '../lib/firebase-client'
import {
  collection,
  query,
  where,
  getDocs,
  limit,
} from 'firebase/firestore'

// Define a default location if needed
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
      setLocations([]) // Clear previous results

      try {
        const venuesCollection = collection(db, 'venues')
        let q // Firestore query variable

        // Determine if we have valid filter parameters
        const hasCity = filterParams?.city
        const hasCountryCode = filterParams?.country
        const useFilter =
          !fetchAll && (hasCity || hasCountryCode)

        if (useFilter) {
          console.log('Filtering venues by:', filterParams)
          // Build query with filters - prioritize city if available
          // Note: Firestore client-side SDK doesn't easily support OR queries across different fields.
          // We'll filter by city primarily, or country if city is missing.
          // Add other essential filters like 'active' here as well.
          if (hasCity) {
            q = query(
              venuesCollection,
              where('city', '==', filterParams.city),
              where(
                'country',
                '==',
                filterParams.country ||
                  DEFAULT_FILTER.country,
              ), // Ensure country matches too if city is specific
              // where('active', '==', true), // Only active venues
              limit(100),
            )
          } else if (hasCountryCode) {
            // Fallback to country if city isn't available
            q = query(
              venuesCollection,
              where('country', '==', filterParams.country),
              // where('active', '==', true),
              limit(100),
            )
          } else {
            // If filterParams exist but lack city/country, maybe use default or fetch all?
            // Using default filter for this example:
            console.log(
              'Using default filter:',
              DEFAULT_FILTER,
            )
            q = query(
              venuesCollection,
              where('city', '==', DEFAULT_FILTER.city),
              where(
                'country',
                '==',
                DEFAULT_FILTER.country,
              ),
              // where('active', '==', true),
              limit(100),
            )
          }
        } else {
          // Fetch all (or a limited subset of all) active/approved venues if fetchAll is true or no filters provided
          console.log(
            'Fetching all active venues (limited)',
          )
          q = query(
            venuesCollection,
            // where('active', '==', true),
            // where('isApproved', '==', true),
            limit(100), // IMPORTANT: Limit results when fetching all client-side
          )
        }

        const querySnapshot = await getDocs(q)
        const fetchedLocations = querySnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
            // Add robust location processing here if needed, similar to getValidPosition
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
        console.log(
          `Fetched ${fetchedLocations.length} venues.`,
        )
      } catch (err) {
        console.error(
          'Error fetching venue locations:',
          err,
        )
        setError(
          err instanceof Error
            ? err
            : new Error('Failed to fetch venues'),
        )
      } finally {
        setLoading(false)
      }
    }

    // Only fetch if filter params are provided OR fetchAll is true
    // Avoid fetching if filterParams is empty object {} and fetchAll is false
    if (
      fetchAll ||
      (filterParams && Object.keys(filterParams).length > 0)
    ) {
      fetchData()
    } else if (
      !filterParams ||
      Object.keys(filterParams).length === 0
    ) {
      // If no filters and not fetching all, decide what to do.
      // Option 1: Fetch default location
      // fetchData(); // (using the default filter logic inside)
      // Option 2: Set loading false and show empty state immediately
      setLoading(false)
      setLocations([])
      console.log(
        'No filter parameters provided, not fetching venues.',
      )
    }
  }, [filterParams?.city, filterParams?.country, fetchAll]) // Re-fetch if filter params or fetchAll change

  return { locations, loading, error }
}

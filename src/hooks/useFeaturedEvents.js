'use client'

import { useState, useEffect } from 'react'
import { db } from '../lib/firebase-client' // Adjust path if needed
import {
  collection,
  query,
  where,
  limit,
  orderBy, // Import orderBy
  getDocs,
} from 'firebase/firestore'

export function useFeaturedEvents(maxEvents = 3) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchFeaturedEvents = async () => {
      setLoading(true)
      setError(null)
      setEvents([]) // Clear previous events

      try {
        // 1. Create the query
        // Fetches events where 'featured' is true, orders them by creation date (newest first),
        // and limits the result count to maxEvents.
        const eventsQuery = query(
          collection(db, 'events'),
          where('featured', '==', true),
          orderBy('createdAt', 'desc'), // Order by creation date, newest first
          limit(maxEvents), // Limit the results
        )

        // 2. Execute the query
        const snapshot = await getDocs(eventsQuery)

        // 3. Process results
        const fetchedEvents = []
        snapshot.docs.forEach((doc) => {
          const data = doc.data()
          fetchedEvents.push({
            id: doc.id,
            ...data,
            // Convert Timestamps for consistency, matching useEventsByVenue format
            date: data.date?.toDate
              ? data.date.toDate().toISOString()
              : null,
            createdAt: data.createdAt?.toDate
              ? data.createdAt.toDate().toISOString()
              : null,
            updatedAt: data.updatedAt?.toDate
              ? data.updatedAt.toDate().toISOString()
              : null,
          })
        })

        console.log(
          `Fetched ${fetchedEvents.length} featured events.`,
        )
        setEvents(fetchedEvents)
      } catch (err) {
        console.error(
          'Error fetching featured events:',
          err,
        )
        setError(
          err.message || 'Failed to fetch featured events.',
        )
      } finally {
        setLoading(false)
      }
    }

    fetchFeaturedEvents()
    // If maxEvents could potentially change during the component's lifecycle
    // and you want the hook to refetch when it does, add it here.
    // Otherwise, an empty dependency array [] means it runs once on mount.
  }, [maxEvents]) // Re-run effect if maxEvents changes

  return { events, loading, error }
}

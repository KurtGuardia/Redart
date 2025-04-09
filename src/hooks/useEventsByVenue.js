'use client' // Hooks used in Client Components run client-side

import { useState, useEffect } from 'react'
import { db } from '../lib/firebase-client' // Adjust path if needed
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore'

// Firestore 'in' query limit (currently 30)
const IN_QUERY_LIMIT = 30

export function useEventsByVenue(venueId) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Skip fetch if no venueId is provided
    if (!venueId) {
      setEvents([])
      setLoading(false)
      setError(null) // Not an error, just no ID
      return
    }

    const fetchVenueAndEvents = async () => {
      setLoading(true)
      setError(null)
      setEvents([]) // Clear previous events

      try {
        // 1. Fetch the venue document
        const venueRef = doc(db, 'venues', venueId)
        const venueSnap = await getDoc(venueRef)

        if (!venueSnap.exists()) {
          throw new Error('Venue not found.')
        }

        // 2. Extract the event IDs array
        const eventIds = venueSnap.data()?.events // Assuming the field is named 'events'

        // 3. Check if eventIds exist and is a non-empty array
        if (
          !Array.isArray(eventIds) ||
          eventIds.length === 0
        ) {
          console.log(
            `Venue ${venueId} has no associated event IDs.`,
          )
          setLoading(false)
          return // No IDs to fetch, not an error
        }

        console.log(
          `Venue ${venueId} has ${eventIds.length} event IDs. Fetching events...`,
        )

        // 4. Fetch events in batches due to 'in' query limit
        const allFetchedEvents = []
        const fetchPromises = []

        for (
          let i = 0;
          i < eventIds.length;
          i += IN_QUERY_LIMIT
        ) {
          const chunkIds = eventIds.slice(
            i,
            i + IN_QUERY_LIMIT,
          )

          // Create a query for the current chunk of IDs
          // We query using the special document ID field '__name__'
          const eventsQuery = query(
            collection(db, 'events'),
            where('__name__', 'in', chunkIds),
            // Note: You cannot combine 'in' with orderBy on a different field easily
            // Sorting will be done client-side after fetching
          )

          // Add the promise to fetch this chunk
          fetchPromises.push(getDocs(eventsQuery))
        }

        // 5. Execute all fetch promises concurrently
        const snapshots = await Promise.all(fetchPromises)

        // 6. Process results from all chunks
        snapshots.forEach((snapshot) => {
          snapshot.docs.forEach((doc) => {
            const data = doc.data()
            allFetchedEvents.push({
              id: doc.id,
              ...data,
              // Convert Timestamp for consistency
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
        })

        // 7. Sort the combined events client-side by date (ascending)
        allFetchedEvents.sort((a, b) => {
          const dateA = a.date
            ? new Date(a.date).getTime()
            : 0
          const dateB = b.date
            ? new Date(b.date).getTime()
            : 0
          return dateA - dateB
        })

        setEvents(allFetchedEvents)
      } catch (err) {
        console.error(
          'Error fetching events by venue:',
          err,
        )
        setError(err.message || 'Failed to fetch events.')
      } finally {
        setLoading(false)
      }
    }

    fetchVenueAndEvents()
  }, [venueId]) // Re-run effect if venueId changes

  return { events, loading, error }
}

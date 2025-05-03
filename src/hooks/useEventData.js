import { useState, useEffect } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../lib/firebase-client' // Adjust path if needed

/**
 * Custom hook to fetch a single event's data by ID on the client-side.
 * @param {string | null} eventId The ID of the event to fetch. Pass null or undefined if ID is not yet available.
 * @returns {{ event: object | null, loading: boolean, error: Error | null }}
 */
export function useEventData(eventId) {
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!eventId) {
      setLoading(false)
      setEvent(null)
      setError(null)
      return
    }

    const fetchEvent = async () => {
      setLoading(true)
      setError(null)
      setEvent(null)

      try {
        const eventRef = doc(db, 'events', eventId)
        const eventSnap = await getDoc(eventRef)

        if (eventSnap.exists()) {
          const data = eventSnap.data()
          setEvent({
            id: eventSnap.id,
            ...data,
          })
        } else {
          setError(new Error('Evento no encontrado.'))
        }
      } catch (err) {
        console.error('Error fetching event data:', err)
        setError(err)
      } finally {
        setLoading(false)
      }
    }

    fetchEvent()
  }, [eventId])

  return { event, loading, error }
}

import {
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react'
import { db } from '../lib/firebase-client'
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  where,
} from 'firebase/firestore'

const ITEMS_PER_PAGE = 24

/**
 * Normalizes a string by converting to lowercase, removing accents and diacritics.
 * @param {string} str The string to normalize.
 * @returns {string} The normalized string.
 */
const normalizeString = (str = '') =>
  str
    .normalize('NFD') // Decompose accented characters (e.g., 'é' -> 'e' + '´')
    .replace(/[\u0300-\u036f]/g, '') // Remove the combining diacritical marks
    .toLowerCase()

/**
 * Custom hook to fetch and manage a list of events from Firestore.
 * Handles searching (client-side), filtering (server-side), pagination,
 * loading states, and errors.
 *
 * @param {string} searchTerm - The term to filter events by (client-side).
 * @param {string} categoryFilter - The category to filter events by ('all' or specific category, server-side).
 * @returns {object} An object containing:
 *  - eventsList: Array of fetched event objects.
 *  - loading: Boolean indicating if the initial fetch or a reset fetch is in progress.
 *  - isFetchingMore: Boolean indicating if pagination fetch is in progress.
 *  - hasMore: Boolean indicating if more events can be loaded.
 *  - error: Error object if fetching failed, otherwise null.
 *  - loadMoreEvents: Function to fetch the next page of events.
 */
export const useEvents = (searchTerm, categoryFilter) => {
  const [eventsList, setEventsList] = useState([])
  const [lastVisible, setLastVisible] = useState(null)
  const [loading, setLoading] = useState(true) // Start loading initially
  const [isFetchingMore, setIsFetchingMore] =
    useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState(null)
  const isInitialMount = useRef(true) // Track initial mount for effects

  // Memoized fetch function
  const fetchEventsInternal = useCallback(
    async (
      currentSearchTerm,
      currentCategoryFilter,
      loadMore = false,
    ) => {
      // Determine loading state based on whether it's a pagination request
      if (!loadMore) {
        setLoading(true)
        setIsFetchingMore(false) // Ensure fetchingMore is false on reset
      } else {
        // Don't proceed if already fetching more or no more items
        if (isFetchingMore || !hasMore) return
        setIsFetchingMore(true)
      }
      setError(null)

      // Reset pagination cursor if not loading more
      const currentLastVisible = loadMore
        ? lastVisible
        : null

      // Get the start of today for date filtering
      const now = new Date()
      const today = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      )
      const todayTimestamp = Timestamp.fromDate(today)

      // Base query constraints
      let eventsQuery = query(
        collection(db, 'events'),
        where('status', '==', 'active'),
        where('date', '>=', todayTimestamp), // Only fetch future or today's events
        orderBy('date', 'desc'),
      )

      // Add category filter if not 'all'
      if (currentCategoryFilter !== 'all') {
        eventsQuery = query(
          eventsQuery,
          where('category', '==', currentCategoryFilter),
        )
      }

      // Add pagination constraint if loading more
      if (currentLastVisible && loadMore) {
        eventsQuery = query(
          eventsQuery,
          startAfter(currentLastVisible),
        )
      }

      // Apply limit *after* all filters and ordering
      eventsQuery = query(
        eventsQuery,
        limit(ITEMS_PER_PAGE),
      )

      try {
        const eventsSnapshot = await getDocs(eventsQuery)
        const newEventsData = eventsSnapshot.docs.map(
          (doc) => ({
            id: doc.id,
            ...doc.data(),
          }),
        )

        // Client-side filtering for search term
        const filteredEvents = newEventsData.filter(
          (event) => {
            // Normalize the search term once
            const normalizedSearchTerm = normalizeString(
              currentSearchTerm,
            )

            // If the normalized search term is empty, don't filter by search
            if (!normalizedSearchTerm) {
              return event.date instanceof Timestamp // Still ensure date is valid
            }

            // Check if any relevant field includes the normalized search term
            const matchesSearch =
              normalizeString(event.title).includes(
                normalizedSearchTerm,
              ) ||
              normalizeString(event.description).includes(
                normalizedSearchTerm,
              ) ||
              normalizeString(event.venueName).includes(
                normalizedSearchTerm,
              ) ||
              normalizeString(event.city).includes(
                normalizedSearchTerm,
              )

            return (
              matchesSearch &&
              event.date instanceof Timestamp
            )
          },
        )

        // Format dates after filtering
        const finalEvents = filteredEvents.map((event) => ({
          ...event,
          date: event.date?.toDate
            ? event.date.toDate().toISOString()
            : null,
          createdAt: event.createdAt?.toDate
            ? event.createdAt.toDate().toISOString()
            : null,
          updatedAt: event.updatedAt?.toDate
            ? event.updatedAt.toDate().toISOString()
            : null,
        }))

        // Update state: Replace list if not loading more, append otherwise
        setEventsList(
          loadMore
            ? (prev) => [...prev, ...finalEvents]
            : finalEvents,
        )

        // Update pagination cursor and hasMore flag
        const lastDocSnapshot =
          eventsSnapshot.docs[
            eventsSnapshot.docs.length - 1
          ]
        setLastVisible(lastDocSnapshot || null)
        setHasMore(
          eventsSnapshot.docs.length === ITEMS_PER_PAGE,
        )
      } catch (err) {
        console.error(
          'Error fetching events in useEvents hook:',
          err,
        )
        setError(
          err instanceof Error
            ? err
            : new Error('Error al cargar eventos.'),
        )
        setEventsList([]) // Clear list on error
        setHasMore(false) // Assume no more items on error
      } finally {
        // Reset loading states
        if (!loadMore) {
          setLoading(false)
        } else {
          setIsFetchingMore(false)
        }
      }
    }, // Remove state dependencies that change *during* the fetch cycle.
    // The function will close over the latest state values (`lastVisible`, `isFetchingMore`, `hasMore`) when called.
    [], // Keep dependencies empty as the function definition itself doesn't change based on props/state.
  )

  // Effect to fetch events when searchTerm or categoryFilter changes (after initial mount)
  useEffect(() => {
    // Skip the effect on the very first render, initial fetch is handled below
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    // Fetch with reset=true (loadMore=false)
    fetchEventsInternal(searchTerm, categoryFilter, false) // Call the latest version of the fetch function
  }, [searchTerm, categoryFilter, fetchEventsInternal]) // Rerun when filters or the fetch function changes

  // Effect for the initial fetch on mount
  useEffect(() => {
    fetchEventsInternal(searchTerm, categoryFilter, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Run only once on mount

  // Function to trigger loading the next page
  const loadMoreEvents = useCallback(() => {
    fetchEventsInternal(searchTerm, categoryFilter, true)
  }, [fetchEventsInternal, searchTerm, categoryFilter])

  return {
    eventsList,
    loading,
    isFetchingMore,
    hasMore,
    error,
    loadMoreEvents,
  }
}

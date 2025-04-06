import { dbAdmin } from './firebase-admin'

const ITEMS_PER_PAGE = 8 // Consistent with EventListView

/**
 * Fetches a paginated list of all events, ordered by date descending.
 * Designed for the initial server-side load.
 * Client-side filtering/pagination handles subsequent loads.
 *
 * @param {number} page - Page number (currently unused, fetches first page)
 * @param {number} limit - Number of items per page
 * @param {object} filters - Filters object (currently unused, filtering is client-side)
 * @returns {Promise<{events: Array<Object>, hasMore: boolean}>}
 */
export async function getAllEvents(
  page = 1, // Keep for potential future server-side pagination extension
  limit = ITEMS_PER_PAGE,
  filters = {},
) {
  try {
    const eventsRef = dbAdmin.collection('events')
    // let query = eventsRef
    //   .orderBy('date', 'desc') // Order by date, newest first
    //   .limit(limit + 1) // Fetch one extra item to check if there are more

    const snapshot = await eventsRef.get()

    let events = snapshot.docs.map((doc) => {
      const data = doc.data()

      // Attempt to create the serializable event object by selecting fields
      try {
        // Select and convert necessary fields explicitly
        const serializableEvent = {
          id: doc.id,
          title: data.title || '',
          description: data.description || '',
          category: data.category || 'other',
          price:
            typeof data.price === 'number' ? data.price : 0,
          currency: data.currency || 'BOB',
          ticketUrl: data.ticketUrl || '',
          venueId: data.venueId || '',
          venueName: data.venueName || '',
          address: data.address || '',
          city: data.city || '',
          country: data.country || '',
          featuredImage: data.featuredImage || null,
          capacity: data.capacity || 0,
          status: data.status || 'active',

          // Convert Timestamps to serializable format (ISO string)
          date: data.date?.toDate().toISOString() || null,
          createdAt:
            data.createdAt?.toDate().toISOString() || null,
          updatedAt:
            data.updatedAt?.toDate().toISOString() || null,

          // Explicitly exclude the raw location object for now
          // If precise location needed on client list, convert GeoPoint here:
          // location: data.location ? {
          //     latitude: data.location._latitude,
          //     longitude: data.location._longitude
          // } : null,
        }
        // --- Log Processed Data ---
        // console.log(`[eventService] Serializable object for doc ${doc.id}:`, JSON.stringify(serializableEvent, null, 2))
        // ------------------------
        return serializableEvent
      } catch (conversionError) {
        console.error(
          `[eventService] Error converting data for doc ${doc.id}:`,
          conversionError,
        )
        console.error(
          `[eventService] Problematic raw data for doc ${doc.id}:`,
          JSON.stringify(data, null, 2),
        )
        // Return null or a placeholder to avoid crashing the map, but indicate error
        return {
          id: doc.id,
          error: 'Data conversion failed',
        }
      }
    })

    // Filter out events that failed conversion, if any
    const validEvents = events.filter(
      (event) => event && !event.error,
    )
    const conversionErrors =
      events.length - validEvents.length
    if (conversionErrors > 0) {
      console.warn(
        `[eventService] ${conversionErrors} event(s) failed data conversion.`,
      )
    }

    // Determine if there are more pages based on original snapshot size vs limit
    let hasMore = false
    if (snapshot.docs.length > limit) {
      hasMore = true
      // Note: We slice the potentially filtered list, which might be smaller than limit
      // This is generally okay, as hasMore is determined before filtering/slicing.
    }

    // Slice the VALID events list after determining hasMore
    const finalEvents = validEvents.slice(0, limit)

    console.log(
      `Fetched ${finalEvents.length} valid events for initial load. HasMore: ${hasMore}`,
    )
    return { events: finalEvents, hasMore }
  } catch (error) {
    console.error('Error fetching all events:', error)
    console.error('Original error:', error)
    // Depending on requirements, either throw or return empty state
    // Throwing might be better for the page to show a generic error
    throw new Error('Could not fetch events.')
    // return { events: [], hasMore: false }; // Alternative: return empty state
  }
}

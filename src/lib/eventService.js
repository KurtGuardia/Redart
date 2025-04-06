import { dbAdmin } from './firebase-admin'

// --- Log dbAdmin on import ---
console.log(
  '[eventService] Imported dbAdmin:',
  typeof dbAdmin,
  dbAdmin ? Object.keys(dbAdmin) : 'null or undefined',
)
// ---------------------------

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
    console.log('[eventService] Entered try block.') // Log entry
    const eventsRef = dbAdmin.collection('events')
    console.log(
      '[eventService] Got events collection reference.',
    ) // Log step

    console.log(
      '[eventService] >> Skipping snapshot.get() for debugging <<',
    )
    // const snapshot = await eventsRef.get() // <-- Temporarily comment out
    console.log(
      '[eventService] Reached point after skipped .get() call.',
    ) // <-- Add this log

    // --- Return Dummy Data ---
    console.log(
      '[eventService] Returning dummy data due to skipped .get()',
    )
    return { events: [], hasMore: false }
    // -------------------------

    /* --- Original logic (commented out) ---
    // console.log(`[eventService] snapshot.get() successful. Found ${snapshot.docs.length} raw documents.`);
    // let events = snapshot.docs.map((doc) => { ... });
    // const validEvents = events.filter(...);
    // ...
    // return { events: finalEvents, hasMore };
    */
  } catch (error) {
    console.error('Error fetching all events:', error)
    console.error('Original error:', error)
    // Depending on requirements, either throw or return empty state
    // Throwing might be better for the page to show a generic error
    throw new Error('Could not fetch events.')
    // return { events: [], hasMore: false }; // Alternative: return empty state
  }
}

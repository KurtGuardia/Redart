import { dbAdmin } from './firebase-admin'
import { Timestamp } from 'firebase-admin/firestore' // Import Timestamp

/**
 * Fetches basic location data for all venues.
 * Used for the main map page.
 * @returns {Promise<Array<{id: string, name: string, latitude: number, longitude: number}>>}
 */
export async function getAllVenueLocations() {
  try {
    const venuesSnapshot = await dbAdmin
      .collection('venues')
      .get()
    const locations = venuesSnapshot.docs
      .map((doc) => {
        const data = doc.data()
        const venueId = doc.id // Get ID for logging

        // Ensure location object exists and latitude/longitude are valid numbers
        if (
          data.location &&
          typeof data.location.latitude === 'number' && // Explicitly check for number type
          typeof data.location.longitude === 'number' // Explicitly check for number type
        ) {
          return {
            id: venueId,
            name: data.name || 'Nombre no disponible', // Provide default name
            latitude: data.location.latitude,
            longitude: data.location.longitude,
          }
        } else {
          // Log the reason for skipping
          console.warn(
            `Skipping venue ${venueId}: Missing or invalid location data. Found:`,
            data.location,
          )
          return null // Exclude venues without valid location data
        }
      })
      .filter((location) => location !== null) // Filter out null entries

    return locations
  } catch (error) {
    console.error('Error fetching venue locations:', error)
    throw new Error('Could not fetch venue locations.') // Re-throw for the page to handle
  }
}

/**
 * Fetches all data for a single venue by its ID.
 * @param {string} venueId - The ID of the venue to fetch.
 * @returns {Promise<Object|null>} Venue data object or null if not found.
 */
export async function getVenueById(venueId) {
  if (!venueId) {
    return null
  }
  try {
    const venueRef = dbAdmin
      .collection('venues')
      .doc(venueId)
    const venueSnap = await venueRef.get()

    if (!venueSnap.exists) {
      return null
    }

    const venueData = venueSnap.data()

    // Ensure photos array exists, default to empty array if not
    const photos = venueData.photos || []
    // Convert Firestore Timestamps and GeoPoint in venueData if necessary
    let createdAtISO = null
    if (
      venueData.createdAt &&
      typeof venueData.createdAt.toDate === 'function'
    ) {
      try {
        createdAtISO = venueData.createdAt
          .toDate()
          .toISOString()
      } catch (e) {
        console.warn(
          `Error converting createdAt for venue ${venueId}:`,
          e,
        )
      }
    } else if (typeof venueData.createdAt === 'string') {
      if (
        new Date(venueData.createdAt).toString() !==
        'Invalid Date'
      ) {
        createdAtISO = venueData.createdAt
      }
    }

    let updatedAtISO = null
    if (
      venueData.updatedAt &&
      typeof venueData.updatedAt.toDate === 'function'
    ) {
      try {
        updatedAtISO = venueData.updatedAt
          .toDate()
          .toISOString()
      } catch (e) {
        console.warn(
          `Error converting updatedAt for venue ${venueId}:`,
          e,
        )
      }
    } else if (typeof venueData.updatedAt === 'string') {
      if (
        new Date(venueData.updatedAt).toString() !==
        'Invalid Date'
      ) {
        updatedAtISO = venueData.updatedAt
      }
    }

    // Convert GeoPoint to plain object
    let locationObj = null
    if (
      venueData.location &&
      typeof venueData.location.latitude === 'number' &&
      typeof venueData.location.longitude === 'number'
    ) {
      locationObj = {
        latitude: venueData.location.latitude,
        longitude: venueData.location.longitude,
      }
    }

    // Explicitly select and build the serializable venue object
    const serializableVenue = {
      id: venueSnap.id,
      name: venueData.name || '',
      logo: venueData.logo || null,
      description: venueData.description || '',
      address: venueData.address || '',
      city: venueData.city || '',
      country: venueData.country || '',
      amenities: venueData.amenities || [],
      photos: photos, // Already ensured photos is an array
      facebookUrl: venueData.facebookUrl || '',
      instagramUrl: venueData.instagramUrl || '',
      whatsappNumber: venueData.whatsappNumber || '',
      location: locationObj,
      createdAt: createdAtISO,
      updatedAt: updatedAtISO,
      status: venueData.status || 'active',
    }

    return serializableVenue
  } catch (error) {
    console.error(`Error fetching venue ${venueId}:`, error)
    throw new Error(
      `Could not fetch venue data for ${venueId}.`,
    )
  }
}

/**
 * Fetches ALL events associated with a specific venue ID, ordered by date ascending.
 * @param {string} venueId - The ID of the venue.
 * @returns {Promise<Array<Object>>} An array of event objects.
 */
export async function getUpcomingEventsForVenue(venueId) {
  if (!venueId) return []

  try {
    const eventsRef = dbAdmin.collection('events')
    const q = eventsRef
      .where('venueId', '==', venueId)
      .orderBy('date', 'asc') // Order events by date

    const eventsSnapshot = await q.get()
    const upcomingEvents = eventsSnapshot.docs.map(
      (doc) => {
        const data = doc.data()
        // Explicitly select and convert fields for serializable event object
        try {
          const serializableEvent = {
            id: doc.id,
            title: data.title || '',
            description: data.description || '',
            category: data.category || 'other',
            price:
              typeof data.price === 'number'
                ? data.price
                : 0,
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
            // Convert Timestamp to serializable format (ISO string)
            date: data.date?.toDate().toISOString() || null,
            // Add other necessary conversions if fields like createdAt exist on events
            // createdAt: data.createdAt?.toDate().toISOString() || null,
            // updatedAt: data.updatedAt?.toDate().toISOString() || null,
          }
          return serializableEvent
        } catch (conversionError) {
          console.error(
            `[venueService/Events] Error converting data for event doc ${doc.id}:`,
            conversionError,
          )
          // Return null or a placeholder to indicate error
          return {
            id: doc.id,
            error: 'Event data conversion failed',
          }
        }
      },
    )

    // Filter out events that failed conversion
    const validEvents = upcomingEvents.filter(
      (event) => event && !event.error,
    )
    const conversionErrors =
      upcomingEvents.length - validEvents.length
    if (conversionErrors > 0) {
      console.warn(
        `[venueService/Events] ${conversionErrors} upcoming event(s) failed data conversion for venue ${venueId}.`,
      )
    }

    return validEvents // Return only valid events
  } catch (error) {
    console.error(
      `Error fetching upcoming events for venue ${venueId}:`,
      error,
    )
    // Decide if throwing an error or returning empty array is better
    // Returning empty might be safer for the UI
    return []
    // throw new Error(`Could not fetch upcoming events for venue ${venueId}.`);
  }
}

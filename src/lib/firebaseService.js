import { db, storage } from './firebase-client'
import {
  Timestamp,
  doc,
  updateDoc,
  GeoPoint,
  addDoc,
  collection,
  setDoc,
  getDoc,
  deleteDoc,
  arrayRemove,
  arrayUnion,
} from 'firebase/firestore'
import {
  getDownloadURL,
  ref,
  uploadBytes,
  deleteObject,
} from 'firebase/storage'
import {
  compressImage,
  compressMultipleImages,
  parseFirebaseStorageUrl,
} from './utils' // Assuming utils are in the same lib folder

// --- Venue Synchronization ---

/**
 * Syncs simplified venue data to the venues_locations collection.
 * @param {string} venueId - The ID of the venue.
 * @param {object} venueData - The venue data object containing fields to sync.
 */
export const syncVenueLocationData = async (
  venueId,
  venueData,
) => {
  if (!venueId || !venueData) {
    console.error(
      'syncVenueLocationData: Missing venueId or venueData',
    )
    return
  }
  try {
    await setDoc(
      doc(db, 'venues_locations', venueId),
      {
        name: venueData.name,
        address: venueData.address,
        city: venueData.city,
        country: venueData.country,
        location: venueData.location, // Expecting GeoPoint or null
        logo: venueData.logo || null,
        active: venueData.active !== false, // Default to true if undefined
        lastUpdated: new Date().toISOString(),
      },
      {
        merge: true,
      },
    )
  } catch (error) {
    console.error(
      'Error syncing venue location data:',
      error,
    )
    // Optionally re-throw or handle differently
  }
}

// --- Event Fetching ---

/**
 * Fetches all events associated with a specific venue ID.
 * @param {string} venueId - The ID of the venue.
 * @returns {Promise<Array>} - A promise that resolves to an array of event objects.
 * @throws Will throw an error if fetching fails.
 */
export const fetchVenueEvents = async (venueId) => {
  if (!venueId) {
    console.log('fetchVenueEvents: venueId is required.')
    return [] // Return empty array if no venueId
  }

  try {
    // 1. Fetch the main venue document to get event IDs
    const venueRef = doc(db, 'venues', venueId)
    const venueSnap = await getDoc(venueRef)

    if (!venueSnap.exists()) {
      console.log(
        'fetchVenueEvents: Venue document not found.',
      )
      return [] // Venue doesn't exist
    }

    // 2. Get the array of event IDs
    const venueData = venueSnap.data()
    const eventIds = venueData.events || []

    if (!Array.isArray(eventIds) || eventIds.length === 0) {
      // console.log("fetchVenueEvents: No event IDs found in the venue's event array.");
      return [] // No events linked
    }

    // 3. Fetch full event details from the main events collection
    const eventPromises = eventIds
      .filter(
        (eventId) => eventId && typeof eventId === 'string',
      ) // Filter out invalid IDs
      .map(async (eventId) => {
        const eventDocRef = doc(db, 'events', eventId)
        const eventSnapshot = await getDoc(eventDocRef)
        if (eventSnapshot.exists()) {
          return {
            id: eventId,
            ...eventSnapshot.data(),
          }
        } else {
          console.warn(
            `fetchVenueEvents: Event document with ID ${eventId} not found.`,
          )
          // Consider adding logic here to remove this invalid ID from the venue's array
          // await updateDoc(venueRef, { events: arrayRemove(eventId) });
          return null // Indicate that this event couldn't be fetched
        }
      })

    const fetchedEvents = (
      await Promise.all(eventPromises)
    ).filter(Boolean) // Filter out null results

    // 4. Sort events by date (most recent first)
    fetchedEvents.sort(
      (a, b) =>
        (b.date?.seconds || 0) - (a.date?.seconds || 0), // Safe sorting
    )

    return fetchedEvents
  } catch (error) {
    console.error('Error fetching venue events:', error)
    throw error // Re-throw the error to be handled by the caller
  }
}

// --- Event CRUD ---

/**
 * Adds a new event to Firestore and links it to the venue.
 * Handles image upload if an image file is provided.
 * @param {string} venueId - The ID of the owning venue.
 * @param {object} eventData - The core data for the new event (without image).
 * @param {File|null} imageFile - The image file to upload (optional).
 * @returns {Promise<string>} - The ID of the newly created event.
 * @throws Will throw an error if adding the event fails.
 */
export const addEvent = async (
  venueId,
  eventData,
  imageFile = null,
) => {
  if (!venueId || !eventData) {
    throw new Error(
      'addEvent: venueId and eventData are required.',
    )
  }

  let eventId = null
  let imageUrl = null

  try {
    // 1. Add the basic event data to the 'events' collection
    const eventRef = await addDoc(
      collection(db, 'events'),
      {
        ...eventData,
        venueId: venueId, // Ensure venueId is set
        image: null, // Initialize image as null
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      },
    )
    eventId = eventRef.id

    // 2. Upload image if provided
    if (imageFile) {
      imageUrl = await uploadEventImage(
        venueId,
        eventId,
        imageFile,
      )
      if (imageUrl) {
        // 3. Update the event document with the image URL
        await updateDoc(eventRef, {
          image: imageUrl,
        })
      } else {
        console.warn(
          `addEvent: Image upload failed for event ${eventId}, proceeding without image.`,
        )
        // Optional: Decide if you want to throw an error here if image upload is critical
      }
    }

    // 4. Add the new event ID to the venue's 'events' array
    const venueRef = doc(db, 'venues', venueId)
    await updateDoc(venueRef, {
      events: arrayUnion(eventId),
    })

    // Return the complete event object including the ID and potential image URL
    return { id: eventId, ...eventData, image: imageUrl }
  } catch (error) {
    console.error(
      'Error in addEvent service function:',
      error,
    )
    // Clean up if necessary (e.g., delete event doc if array update fails?)
    // This part is tricky and depends on desired atomicity.
    // For now, just re-throw.
    throw error
  }
}

/**
 * Updates an existing event in Firestore.
 * Handles image update (uploading new, deleting old).
 * @param {string} eventId - The ID of the event to update.
 * @param {object} updatedData - An object containing the fields to update.
 * @param {string|null} oldImageUrl - The URL of the existing image, if any, for deletion.
 * @param {File|null|undefined} newImageFile - The new image file (File), null (to remove), or undefined (no change).
 * @param {string} venueId - The ID of the venue (needed for image path).
 * @throws Will throw an error if updating the event fails.
 */
export const updateEventDetails = async (
  eventId,
  updatedData,
  oldImageUrl,
  newImageFile,
  venueId,
) => {
  if (!eventId || !updatedData || !venueId) {
    throw new Error(
      'updateEventDetails: eventId, updatedData, and venueId are required.',
    )
  }

  const eventRef = doc(db, 'events', eventId)
  let finalImageUrl = oldImageUrl // Start with the old URL

  try {
    // Handle Image Update Logic
    if (newImageFile instanceof File) {
      // === New image uploaded ===
      console.log(
        'updateEventDetails: New image file detected for upload.',
      )
      // 1. Delete the old image *before* uploading the new one (if old exists)
      if (oldImageUrl) {
        await deleteStorageFile(oldImageUrl) // Use generic deletion helper
      }
      // 2. Upload the new image
      finalImageUrl = await uploadEventImage(
        venueId,
        eventId,
        newImageFile,
      )
      if (!finalImageUrl) {
        // Upload failed, revert to old URL (or null if none existed)
        console.warn(
          `updateEventDetails: New event image upload failed for ${eventId}. Reverting.`,
        )
        finalImageUrl = oldImageUrl
        // Optionally throw an error here or inform the user
      }
    } else if (newImageFile === null && oldImageUrl) {
      // === Image explicitly removed ===
      console.log(
        `updateEventDetails: Event image explicitly removed for ${eventId}.`,
      )
      await deleteStorageFile(oldImageUrl)
      finalImageUrl = null
    }
    // Else (newImageFile is undefined): Image not changed, finalImageUrl remains oldImageUrl

    // Prepare data for Firestore update
    const dataToUpdate = {
      ...updatedData,
      image: finalImageUrl, // Set the final image URL (can be new, old, or null)
      updatedAt: Timestamp.now(),
    }

    // Remove fields that shouldn't be directly updated if they exist in updatedData
    delete dataToUpdate.id
    delete dataToUpdate.createdAt // Should not be changed

    // Update Firestore
    await updateDoc(eventRef, dataToUpdate)

    // Return the updated state (caller might use this to update UI)
    // Fetch the updated doc to be absolutely sure? Or merge locally? Merging locally is faster.
    const updatedDocSnap = await getDoc(eventRef)
    if (updatedDocSnap.exists()) {
      return { id: eventId, ...updatedDocSnap.data() }
    } else {
      // This shouldn't happen if updateDoc succeeded, but handle defensively
      console.error(
        `updateEventDetails: Event ${eventId} not found after update.`,
      )
      throw new Error(
        `Event ${eventId} not found after update.`,
      )
    }
  } catch (error) {
    console.error(`Error updating event ${eventId}:`, error)
    throw error // Re-throw for the caller to handle
  }
}

/**
 * Deletes an event from Firestore and its associated image from Storage.
 * Removes the event ID from the venue's event list.
 * @param {string} venueId - The ID of the owning venue.
 * @param {string} eventId - The ID of the event to delete.
 * @param {string|null} imageUrl - The URL of the event's image (optional).
 * @throws Will throw an error if deletion fails.
 */
export const deleteEvent = async (
  venueId,
  eventId,
  imageUrl = null,
) => {
  if (!venueId || !eventId) {
    throw new Error(
      'deleteEvent: venueId and eventId are required.',
    )
  }

  const eventRef = doc(db, 'events', eventId)
  const venueRef = doc(db, 'venues', venueId)

  try {
    // 1. Delete the event image from Storage (if URL provided)
    if (imageUrl) {
      await deleteStorageFile(
        imageUrl,
        `venues/${venueId}/events/${eventId}/`,
      )
    }

    // 2. Delete the event document from 'events' collection
    await deleteDoc(eventRef)

    // 3. Remove the event ID from the venue's 'events' array
    // Use updateDoc with arrayRemove - this is safer if the venue doc might not exist briefly
    // although in this context it should exist. Using updateDoc avoids overwriting other fields.
    await updateDoc(venueRef, {
      events: arrayRemove(eventId),
    })
  } catch (error) {
    console.error(`Error deleting event ${eventId}:`, error)
    // Consider more specific error handling or cleanup if needed
    throw error // Re-throw for the caller
  }
}

// --- Venue Details CRUD ---

/**
 * Updates venue details in Firestore, handles logo and photo updates/deletions.
 * Also triggers syncVenueLocationData.
 * @param {string} venueId - The ID of the venue.
 * @param {object} updatedData - Raw data from the form/modal.
 * @param {object} currentVenueData - The current venue data (needed for comparison and old values).
 * @returns {Promise<object>} - The updated venue data object.
 * @throws Will throw an error if the update fails.
 */
export const updateVenueDetails = async (
  venueId,
  updatedData,
  currentVenueData,
) => {
  if (!venueId || !updatedData || !currentVenueData) {
    throw new Error(
      'updateVenueDetails: venueId, updatedData, and currentVenueData are required.',
    )
  }

  const venueRef = doc(db, 'venues', venueId)
  const {
    location,
    photos: updatedPhotosInput, // Can be array of strings/Files
    logo: updatedLogoInput, // Can be string, File, or null
    ...otherData
  } = updatedData

  const oldLogoUrl = currentVenueData.logo
  const oldPhotos = currentVenueData.photos || []

  try {
    // --- Prepare Core Data ---
    const formattedData = {
      ...otherData,
      updatedAt: Timestamp.now(),
    }

    // --- Handle Location ---
    if (
      location &&
      typeof location.lat === 'number' &&
      typeof location.lng === 'number'
    ) {
      formattedData.location = new GeoPoint(
        location.lat,
        location.lng,
      )
    } else {
      // Keep existing location if not updated or invalid format
      formattedData.location =
        currentVenueData.location || null
    }

    // --- Handle Logo ---
    let finalLogoUrl = oldLogoUrl
    if (updatedLogoInput instanceof File) {
      // New logo file provided
      if (oldLogoUrl) {
        await deleteLogo(oldLogoUrl, venueId) // Delete old before upload
      }
      finalLogoUrl = await uploadVenueLogo(
        updatedLogoInput,
        venueId,
      )
      if (!finalLogoUrl) {
        console.warn(
          'Venue logo upload failed, reverting to old logo if available.',
        )
        finalLogoUrl = oldLogoUrl
        // Potentially throw error if logo is critical
      }
    } else if (updatedLogoInput === null && oldLogoUrl) {
      // Logo explicitly removed
      await deleteLogo(oldLogoUrl, venueId)
      finalLogoUrl = null
    }
    // else: Logo not changed (updatedLogoInput is same string or was already null), finalLogoUrl remains correct.
    formattedData.logo = finalLogoUrl

    // --- Handle Photos ---
    let finalPhotoUrls = oldPhotos
    if (Array.isArray(updatedPhotosInput)) {
      // Identify photos to delete
      const currentPhotoUrls = updatedPhotosInput.filter(
        (p) => typeof p === 'string',
      )
      const deletedPhotos = oldPhotos.filter(
        (oldUrl) => !currentPhotoUrls.includes(oldUrl),
      )

      // Identify new photos to upload
      const newPhotoFiles = updatedPhotosInput.filter(
        (p) => p instanceof File,
      )

      // Perform deletions
      const deletePromises = deletedPhotos.map((url) =>
        deletePhoto(url, venueId),
      )
      await Promise.all(deletePromises)

      // Perform uploads
      const uploadedUrls = await uploadPhotos(
        newPhotoFiles,
        venueId,
      ) // uploadPhotos handles compression

      // Combine existing and newly uploaded URLs
      finalPhotoUrls = [
        ...currentPhotoUrls,
        ...uploadedUrls,
      ]
    }
    // else: photos weren't part of updatedData or not an array, keep existing.
    formattedData.photos = finalPhotoUrls

    // --- Update Firestore ---
    await updateDoc(venueRef, formattedData)
    console.log(`Venue ${venueId} updated successfully.`)

    // --- Sync to venues_locations ---
    // Construct the data needed for sync using the FINAL updated values
    const dataForSync = {
      ...currentVenueData, // Start with old data
      ...formattedData, // Overwrite with updates (includes final logo, photos, location)
      active: formattedData.active !== false, // Ensure active status is correct
    }
    await syncVenueLocationData(venueId, dataForSync)

    // Return the latest venue data by merging or re-fetching
    // Merging locally is faster:
    return { ...currentVenueData, ...formattedData }
    // Alternatively, re-fetch:
    // const updatedDoc = await getDoc(venueRef);
    // return updatedDoc.exists() ? { id: venueId, ...updatedDoc.data() } : null;
  } catch (error) {
    console.error(`Error updating venue ${venueId}:`, error)
    throw error // Re-throw for the caller
  }
}

// --- Storage Helpers (Consider moving to a separate storageService.js later if grows) ---

/**
 * Uploads an event image after compression.
 * @param {string} venueId - Venue ID.
 * @param {string} eventId - Event ID.
 * @param {File} file - The image file.
 * @returns {Promise<string|null>} Download URL or null on error.
 */
export const uploadEventImage = async (
  venueId,
  eventId,
  file,
) => {
  if (!file || !venueId || !eventId) return null
  try {
    console.log(
      `Starting event image upload: ${file.name}, type: ${
        file.type
      }, size: ${Math.round(file.size / 1024)}KB`,
    )
    const compressedFile = await compressImage(file) // Use util
    console.log(
      `After compression: ${compressedFile.name}, type: ${
        compressedFile.type
      }, size: ${Math.round(compressedFile.size / 1024)}KB`,
    )

    const filename = `${Date.now()}_${compressedFile.name}`
    const storagePath = `venues/${venueId}/events/${eventId}/${filename}`
    const storageRef = ref(storage, storagePath)

    // Upload with metadata to ensure correct content-type
    const metadata = {
      contentType: compressedFile.type,
    }

    await uploadBytes(storageRef, compressedFile, metadata)
    const downloadURL = await getDownloadURL(storageRef)
    console.log(
      `Event image upload successful: ${downloadURL}`,
    )
    return downloadURL
  } catch (error) {
    console.error(
      `Error uploading event image for event ${eventId}:`,
      error,
    )
    return null
  }
}

/**
 * Uploads a venue logo after compression.
 * @param {File} file - The logo file.
 * @param {string} venueId - Venue ID.
 * @returns {Promise<string|null>} Download URL or null on error.
 */
export const uploadVenueLogo = async (file, venueId) => {
  if (!file || !venueId) return null
  try {
    console.log(
      `Starting venue logo upload: ${file.name}, type: ${
        file.type
      }, size: ${Math.round(file.size / 1024)}KB`,
    )
    const compressedFile = await compressImage(file) // Use util
    console.log(
      `After compression: ${compressedFile.name}, type: ${
        compressedFile.type
      }, size: ${Math.round(compressedFile.size / 1024)}KB`,
    )

    const filename = `${Date.now()}_${compressedFile.name}`
    const storagePath = `venues/${venueId}/logo/${filename}`
    const storageRef = ref(storage, storagePath)

    // Upload with metadata to ensure correct content-type
    const metadata = {
      contentType: compressedFile.type,
    }

    await uploadBytes(storageRef, compressedFile, metadata)
    const downloadURL = await getDownloadURL(storageRef)
    console.log(
      `Venue logo upload successful: ${downloadURL}`,
    )
    return downloadURL
  } catch (error) {
    console.error(
      `Error uploading venue logo for venue ${venueId}:`,
      error,
    )
    return null
  }
}

/**
 * Deletes a venue logo from Storage.
 * @param {string} logoUrl - The URL of the logo to delete.
 * @param {string} venueId - Venue ID (for path verification).
 */
export const deleteLogo = async (logoUrl, venueId) => {
  await deleteStorageFile(
    logoUrl,
    `venues/${venueId}/logo/`,
  )
}

/**
 * Uploads multiple venue photos after compression. Returns an array of URLs.
 * Filters out non-File inputs and handles compression errors individually.
 * @param {Array<File>} photos - Array of File objects.
 * @param {string} venueId - Venue ID.
 * @returns {Promise<string[]>} Array of successfully uploaded photo URLs.
 */
export const uploadPhotos = async (photos, venueId) => {
  if (
    !Array.isArray(photos) ||
    photos.length === 0 ||
    !venueId
  )
    return []

  const photoFiles = photos.filter((p) => p instanceof File)
  if (photoFiles.length === 0) return []

  try {
    console.log(
      `Starting upload of ${photoFiles.length} photos for venue ${venueId}`,
    )

    // Compress first
    const compressedPhotos = await compressMultipleImages(
      photoFiles,
    ) // Use util

    const uploadPromises = compressedPhotos.map(
      async (photo) => {
        try {
          console.log(
            `Uploading photo: ${photo.name}, type: ${
              photo.type
            }, size: ${Math.round(photo.size / 1024)}KB`,
          )
          const timestamp = new Date().getTime()
          const fileName = `${timestamp}_${photo.name}`
          const storageRef = ref(
            storage,
            `venues/${venueId}/photos/${fileName}`,
          )

          // Upload with metadata to ensure correct content-type
          const metadata = {
            contentType: photo.type,
          }

          await uploadBytes(storageRef, photo, metadata)
          const url = await getDownloadURL(storageRef)
          console.log(`Photo upload successful: ${url}`)
          return url
        } catch (uploadError) {
          console.error(
            `Error uploading photo ${photo.name} (type: ${photo.type}):`,
            uploadError,
          )
          return null // Return null for failed uploads
        }
      },
    )

    const results = await Promise.all(uploadPromises)
    return results.filter(Boolean) // Filter out nulls (failed uploads)
  } catch (compressionError) {
    console.error(
      'Error during photo compression phase:',
      compressionError,
    )
    // Decide handling: maybe return empty array or throw? Returning empty for now.
    return []
  }
}

/**
 * Deletes a venue photo from Storage.
 * @param {string} photoUrl - URL of the photo to delete.
 * @param {string} venueId - Venue ID (for path verification).
 */
export const deletePhoto = async (photoUrl, venueId) => {
  await deleteStorageFile(
    photoUrl,
    `venues/${venueId}/photos/`,
  )
}

/**
 * Generic function to delete a file from Firebase Storage using its URL.
 * Includes optional path prefix check for safety.
 * @param {string} fileUrl - The full HTTPS URL of the file in Firebase Storage.
 * @param {string} [expectedPathPrefix] - Optional. If provided, deletion only proceeds if the extracted path starts with this prefix.
 * @returns {Promise<boolean>} - True if deletion was attempted (or not needed), false if URL parse failed or path check failed.
 */
export const deleteStorageFile = async (
  fileUrl,
  expectedPathPrefix = null,
) => {
  if (!fileUrl) {
    // console.warn("deleteStorageFile: No file URL provided.");
    return true // Nothing to delete
  }

  const filePath = parseFirebaseStorageUrl(fileUrl) // Use util

  if (!filePath) {
    console.error(
      'deleteStorageFile: Could not parse file path from URL:',
      fileUrl,
    )
    return false // Indicate failure
  }

  // Safety check: Ensure the file path starts with the expected prefix if provided
  if (
    expectedPathPrefix &&
    !filePath.startsWith(expectedPathPrefix)
  ) {
    console.warn(
      `deleteStorageFile: Attempted to delete file outside expected path. Path: '${filePath}', Expected Prefix: '${expectedPathPrefix}'`,
    )
    return false // Indicate path check failure
  }

  try {
    const fileRef = ref(storage, filePath)
    await deleteObject(fileRef)
    console.log(
      `deleteStorageFile: File deleted successfully from path: ${filePath}`,
    )
    return true
  } catch (error) {
    // Handle specific 'object-not-found' error gracefully
    if (error.code === 'storage/object-not-found') {
      console.log(
        `deleteStorageFile: File not found (may have been already deleted): ${filePath}`,
      )
      return true // Treat as success if file doesn't exist
    } else {
      console.error(
        `deleteStorageFile: Error deleting file ${filePath}:`,
        error,
      )
      throw error // Re-throw other errors
    }
  }
}

// --- Potentially add updateVenueDetails logic extraction here ---
// --- Potentially add updateEventDetails logic extraction here ---

// Note: Functions like handleEditVenue and handleEditEvent still reside in the component
// They will orchestrate validation, prepare data, and call these service functions.
// File objects (logo, photos, event image) will be passed from the component to the relevant service functions.

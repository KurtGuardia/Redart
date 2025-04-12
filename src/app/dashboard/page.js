'use client'

import { useState, useEffect } from 'react'
import {
  auth,
  db,
  storage,
} from '../../lib/firebase-client'
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
import { useRouter } from 'next/navigation'
import { useVenueData } from '../../hooks/useVenueData'
import Spot from '../../components/ui/Spot'
import EditModal from '../../components/EditModal'
import {
  CATEGORIES,
  AMENITIES_OPTIONS,
} from '../../lib/constants'
import {
  isValidUrl,
  compressImage,
  compressMultipleImages,
  validateFacebookUrl,
  validateInstagramUrl,
  validateWhatsappNumber,
} from '../../lib/utils'
import EventDetailModal from '../../components/EventDetailModal'
import DashboardSkeleton from '../../components/DashboardSkeleton'
import VenueDetailsCard from '../../components/dashboard/VenueDetailsCard'
import EventManagementSection from '../../components/dashboard/EventManagementSection'

// Function to sync venue data with venues_locations collection
const syncVenueLocationData = async (
  venueId,
  venueData,
) => {
  try {
    // Create a simplified venue location document
    await setDoc(
      doc(db, 'venues_locations', venueId),
      {
        name: venueData.name,
        address: venueData.address,
        city: venueData.city,
        country: venueData.country,
        location: venueData.location,
        logo: venueData.logo,
        active: venueData.active,
        lastUpdated: new Date().toISOString(),
      },
      { merge: true },
    )
  } catch (error) {
    console.error(
      'Error syncing venue location data:',
      error,
    )
  }
}

export default function Dashboard() {
  const [venueId, setVenueId] = useState(null)
  const [eventsLoading, setEventsLoading] = useState(true)
  const [events, setEvents] = useState([])
  const [isEditModalOpen, setIsEditModalOpen] =
    useState(false)
  const [isEventEditModalOpen, setIsEventEditModalOpen] =
    useState(false)
  const [currentEvent, setCurrentEvent] = useState(null)
  const [selectedEventDetail, setSelectedEventDetail] =
    useState(null)

  const [isDetailModalOpen, setIsDetailModalOpen] =
    useState(false)
  const [filterStatus, setFilterStatus] = useState('all')
  const [eventFormError, setEventFormError] = useState('')
  const [eventSuccess, setEventSuccess] = useState('')
  const { venue, loading, error, refreshVenue } =
    useVenueData(venueId)

  const router = useRouter()

  // Effect to handle authentication state changes and set venue ID
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(
      (currentVenue) => {
        if (currentVenue) {
          setVenueId(currentVenue.uid)
        } else {
          // Redirect to login if not authenticated
          router.push('/login')
        }
      },
    )

    return () => unsubscribe()
  }, [])

  // Fetch events from Firestore when component initializes or venueId changes
  useEffect(() => {
    const fetchEvents = async () => {
      if (!venueId) return

      try {
        setEventsLoading(true)

        // 1. Fetch the main venue document
        const venueRef = doc(db, 'venues', venueId)
        const venueSnap = await getDoc(venueRef)

        if (!venueSnap.exists()) {
          console.log(
            'Venue document not found, cannot fetch events.',
          )
          setEvents([])
          setEventsLoading(false)
          return
        }

        // 2. Get the array of event IDs from the venue data
        const venueData = venueSnap.data()
        const eventIds = venueData.events || [] // Get the 'events' array, default to empty

        // If no event IDs found in the array, return empty
        if (
          !Array.isArray(eventIds) ||
          eventIds.length === 0
        ) {
          console.log(
            "No event IDs found in the venue's event array.",
          )
          setEvents([])
          setEventsLoading(false)
          return
        }

        // 3. Fetch full event details from the main events collection based on IDs
        const fetchedEvents = []
        await Promise.all(
          eventIds.map(async (eventId) => {
            if (!eventId || typeof eventId !== 'string')
              return // Skip invalid IDs
            const eventDocRef = doc(db, 'events', eventId)
            const eventSnapshot = await getDoc(eventDocRef)

            if (eventSnapshot.exists()) {
              fetchedEvents.push({
                id: eventId,
                ...eventSnapshot.data(),
              })
            } else {
              console.warn(
                `Event document with ID ${eventId} not found.`,
              )
              // Optional: You might want to clean up this ID from the venue's array here
              // if an event doc is missing but its ID is still in the array.
            }
          }),
        )

        // 4. Sort events by date (most recent first)
        fetchedEvents.sort(
          (a, b) =>
            (b.date?.seconds || 0) - (a.date?.seconds || 0), // Safe sorting
        )

        setEvents(fetchedEvents)
      } catch (error) {
        console.error('Error fetching events:', error)
        setEvents([]) // Reset events on error
      } finally {
        setEventsLoading(false)
      }
    }

    fetchEvents()
  }, [venueId])

  // Function to delete an event
  const deleteEvent = async (eventId, image) => {
    if (!venueId || !eventId) {
      console.error(
        'Missing venueId or eventId for deletion',
      )
      setEventFormError(
        'Error: Información incompleta para eliminar evento.',
      )
      return
    }
    try {
      // Delete the event from the main events collection
      const eventRef = doc(db, 'events', eventId)
      await deleteDoc(eventRef)

      // Remove event ID from the venue's events array field
      const venueRef = doc(db, 'venues', venueId)
      await updateDoc(venueRef, {
        events: arrayRemove(eventId),
      })

      // Delete the featured image from storage if it exists
      if (image) {
        try {
          // Use the URL parsing logic directly
          const url = new URL(image)
          const pathName = decodeURIComponent(url.pathname)
          // Path format: /v0/b/BUCKET_NAME/o/ENCODED_FILE_PATH
          const parts = pathName.split('/o/')
          if (parts.length > 1) {
            const encodedFilePath = parts[1]
            const filePath =
              decodeURIComponent(encodedFilePath)
            // Optional: Double check it's within the expected events folder
            if (
              filePath.startsWith(
                `venues/${venueId}/events/${eventId}/`,
              )
            ) {
              const imageRef = ref(storage, filePath)
              await deleteObject(imageRef)
              console.log(
                'Event image deleted successfully from storage:',
                filePath,
              )
            } else {
              console.warn(
                'Attempted to delete event image outside expected path:',
                filePath,
                'Expected prefix:',
                `venues/${venueId}/events/${eventId}/`,
              )
            }
          } else {
            console.error(
              'Could not extract file path from event image URL:',
              image,
            )
          }
        } catch (error) {
          // Keep this catch block for errors during the URL parsing/deletion attempt
          console.error(
            'Error deleting event image:',
            error,
            'URL:',
            image,
          )
          // Don't block the rest of the deletion if image deletion fails
        }
      }

      // Update local state to remove the deleted event
      setEvents(
        events.filter((event) => event.id !== eventId),
      )

      // Show success message
      setEventSuccess('¡Evento eliminado exitosamente!')
      setTimeout(() => {
        setEventSuccess('')
      }, 3000)
    } catch (error) {
      console.error('Error deleting event:', error)
      setEventFormError(
        'Error al eliminar el evento. Inténtelo de nuevo.',
      )
    }
  }

  // Helper function to upload new photos to Firebase Storage
  const uploadPhotos = async (photos, venueId) => {
    if (!photos || photos.length === 0) return []

    const urls = []

    // First add all existing photo URLs (strings)
    for (const photo of photos) {
      if (typeof photo === 'string') {
        urls.push(photo)
      }
    }

    // Collect all new photos (File objects)
    const newPhotos = photos.filter(
      (photo) => typeof photo !== 'string',
    )

    // Compress all new photos before uploading
    const compressedPhotos = await compressMultipleImages(
      newPhotos,
    )

    // Upload the compressed photos
    for (const photo of compressedPhotos) {
      try {
        // Add timestamp to filename to avoid cache issues
        const timestamp = new Date().getTime()
        const fileName = `${timestamp}_${photo.name}`
        const storageRef = ref(
          storage,
          `venues/${venueId}/photos/${fileName}`,
        )

        await uploadBytes(storageRef, photo)
        const url = await getDownloadURL(storageRef)
        urls.push(url)
      } catch (error) {
        console.error('Error uploading photo:', error)
      }
    }

    return urls
  }

  // Helper function to delete a photo from Firebase Storage
  const deletePhoto = async (photoUrl) => {
    if (!photoUrl || !venueId) return // Also check venueId just in case
    try {
      // Correctly extract the storage path from the URL
      const url = new URL(photoUrl)
      const pathName = decodeURIComponent(url.pathname)

      // Path format: /v0/b/BUCKET_NAME/o/ENCODED_FILE_PATH
      const parts = pathName.split('/o/')
      if (parts.length > 1) {
        const encodedFilePath = parts[1]
        const filePath = decodeURIComponent(encodedFilePath)
        // Optional: Add a check to ensure it's within the expected photos folder
        if (
          filePath.startsWith(`venues/${venueId}/photos/`)
        ) {
          const photoRef = ref(storage, filePath)
          await deleteObject(photoRef)
          console.log(
            'Venue photo deleted successfully from storage:',
            filePath,
          )
        } else {
          console.warn(
            'Attempted to delete photo outside expected path:',
            filePath,
          )
        }
      } else {
        console.error(
          'Could not extract file path from photo URL:',
          photoUrl,
        )
      }
    } catch (error) {
      console.error(
        'Error deleting venue photo from storage:',
        error,
        'URL:',
        photoUrl,
      )
      // Don't block the main update if deletion fails, but log it.
    }
  }

  // Function to upload event image to Firebase Storage
  const uploadEventImage = async (file, eventId = null) => {
    try {
      if (!file || !venueId) return null

      // Compress the image before uploading
      const compressedFile = await compressImage(file)

      // Create a unique filename
      const filename = `${Date.now()}_${
        compressedFile.name
      }`

      // Create the storage path based on whether eventId is provided
      let storagePath
      if (eventId) {
        // New structure with eventId folder
        storagePath = `venues/${venueId}/events/${eventId}/${filename}`
      } else {
        // Use a temporary path for new events that don't have an ID yet
        storagePath = `venues/${venueId}/events/temp/${filename}`
      }

      const storageRef = ref(storage, storagePath)

      // Upload the compressed file
      await uploadBytes(storageRef, compressedFile)

      // Get download URL
      const downloadURL = await getDownloadURL(storageRef)
      return downloadURL
    } catch (error) {
      console.error('Error uploading event image:', error)
      return null
    }
  }

  // Helper function to upload a new venue logo
  const uploadVenueLogo = async (file, venueId) => {
    if (!file || !venueId) return null
    try {
      // Compress the image before uploading
      const compressedFile = await compressImage(file)
      // Create a unique filename (using timestamp to avoid cache issues)
      const filename = `${Date.now()}_${
        compressedFile.name
      }`
      const storagePath = `venues/${venueId}/logo/${filename}`
      const storageRef = ref(storage, storagePath)

      await uploadBytes(storageRef, compressedFile)
      const downloadURL = await getDownloadURL(storageRef)
      return downloadURL
    } catch (error) {
      console.error('Error uploading venue logo:', error)
      // Optionally set an error state here
      return null
    }
  }

  // Helper function to delete venue logo from Storage
  const deleteVenueLogo = async (logoUrl, venueId) => {
    if (!logoUrl || !venueId) return
    // Extract the file path from the URL
    try {
      const url = new URL(logoUrl)
      const pathName = decodeURIComponent(url.pathname)
      const parts = pathName.split('/o/')
      if (parts.length > 1) {
        const encodedFilePath = parts[1]
        const filePath = decodeURIComponent(encodedFilePath)
        // Double check it's actually in the expected logo path
        if (
          filePath.startsWith(`venues/${venueId}/logo/`)
        ) {
          const logoRef = ref(storage, filePath)
          await deleteObject(logoRef)
          console.log('Old venue logo deleted successfully')
        }
      }
    } catch (error) {
      console.error('Error deleting old venue logo:', error)
      // Don't block the main operation if deletion fails, just log it.
    }
  }

  // Function to add a new event to Firestore
  const addEvent = async (eventData) => {
    try {
      // Add event to Firestore events collection
      const eventRef = await addDoc(
        collection(db, 'events'),
        eventData,
      )

      const eventId = eventRef.id

      // Add the eventId to the venue's 'events' array field
      if (venueId) {
        // Ensure venueId is available
        const venueRef = doc(db, 'venues', venueId)
        await updateDoc(venueRef, {
          events: arrayUnion(eventId),
        })
      } else {
        console.error(
          "Cannot update venue's event array: venueId is missing.",
        )
        // Decide how to handle this? Maybe throw an error?
        // For now, the event is created but not linked in the venue array.
      }

      // Return the ID of the newly created event
      return eventId
    } catch (error) {
      console.error('Error in addEvent function:', error)
      // Rethrow the error so handleAddEvent can catch it
      throw error
    }
  }

  const handleAddEvent = async (formData, imageFile) => {
    setEventFormError('')
    setEventSuccess('')
    try {
      // --- Validation (use formData properties) ---
      if (!formData.title?.trim()) {
        throw new Error(
          'El título del evento es obligatorio',
        )
      }
      if (!formData.date) {
        // Check if date string exists
        throw new Error(
          'La fecha y hora del evento son obligatorias',
        )
      }
      const eventDateTime = new Date(formData.date) // Parse the date string
      if (isNaN(eventDateTime.getTime())) {
        // Check if date is valid
        throw new Error('Formato de fecha y hora inválido')
      }
      if (eventDateTime < new Date()) {
        throw new Error(
          'La fecha del evento debe ser en el futuro',
        )
      }
      if (!formData.description?.trim()) {
        throw new Error(
          'La descripción del evento es obligatoria',
        )
      }
      if (!formData.category) {
        throw new Error(
          'La categoría del evento es obligatoria',
        )
      }
      if (!venueId) {
        throw new Error(
          'No se encontró información del local (venueId)',
        )
      }
      if (
        formData.ticketUrl &&
        !isValidUrl(formData.ticketUrl)
      ) {
        throw new Error(
          'El formato de la URL de venta de entradas no es válido',
        )
      }

      // --- Create newEventData (use formData properties) ---
      const newEventData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        date: Timestamp.fromDate(eventDateTime), // Use parsed date
        category: formData.category,
        price: formData.price
          ? parseFloat(Number(formData.price).toFixed(2))
          : 0,
        currency: formData.currency || 'BOB',
        ticketUrl: formData.ticketUrl
          ? formData.ticketUrl.trim()
          : null,
        status: 'active', // Default status for new events
        venueId: venueId,
        venueName: venue?.name || '',
        location: venue?.location || null,
        address: venue?.address || '',
        city: venue?.city || '',
        country: venue?.country || '',
        image: null, // Initialize image as null
        capacity: venue?.capacity || null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      }

      // Add event to Firestore (this function should handle adding ID to venue array)
      const eventId = await addEvent(newEventData) // Assuming addEvent returns the new event ID

      // Upload image if provided (using the separate imageFile parameter)
      let imageUrl = null
      if (imageFile) {
        imageUrl = await uploadEventImage(
          imageFile,
          eventId,
        ) // Pass eventId

        // Update the event document with the image URL if upload was successful
        if (imageUrl) {
          const eventRef = doc(db, 'events', eventId)
          await updateDoc(eventRef, { image: imageUrl })
          newEventData.image = imageUrl // Update local object for immediate display
        }
      }

      // Update local state with the new event (including potential image URL)
      setEvents([
        { id: eventId, ...newEventData },
        ...events,
      ])

      // Reset form fields is now handled within EventCreateForm itself upon success

      // Show success message (managed by this component)
      setEventSuccess('¡Evento agregado exitosamente!')
      setTimeout(() => {
        setEventSuccess('')
      }, 5000)

      // Scroll logic might need adjustment or removal if form isn't directly here
      // document.getElementById('eventTitle')?.scrollIntoView({ behavior: 'smooth' })

      return true // Signal success to EventCreateForm
    } catch (error) {
      console.error('Error adding event:', error) // Log the full error
      setEventFormError(
        error.message ||
          'Error al agregar el evento. Inténtelo de nuevo.',
      )
      // Scrolling logic might need adjustment or removal
      // document.querySelector('form')?.scrollIntoView({ behavior: 'smooth' })
      return false // Signal failure to EventCreateForm
    }
  }

  const handleEditVenue = async (updatedData) => {
    try {
      // --- Start Validation ---
      if (
        updatedData.facebookUrl &&
        !validateFacebookUrl(updatedData.facebookUrl)
      ) {
        console.error(
          'Validation failed: Invalid Facebook URL provided.',
          updatedData.facebookUrl,
        )
        // Optionally show an error message to the user via state
        alert(
          'La URL de Facebook proporcionada no parece válida.',
        )
        return // Prevent saving
      }
      if (
        updatedData.instagramUrl &&
        !validateInstagramUrl(updatedData.instagramUrl)
      ) {
        console.error(
          'Validation failed: Invalid Instagram URL provided.',
          updatedData.instagramUrl,
        )
        alert(
          'La URL de Instagram proporcionada no parece válida.',
        )
        return // Prevent saving
      }
      if (
        updatedData.whatsappNumber &&
        !validateWhatsappNumber(updatedData.whatsappNumber)
      ) {
        console.error(
          'Validation failed: Invalid WhatsApp number provided.',
          updatedData.whatsappNumber,
        )
        alert(
          'El número de WhatsApp debe empezar con + y el código de país.',
        )
        return // Prevent saving
      }
      // --- End Validation ---

      const venueRef = doc(db, 'venues', venueId)

      // Extract location, photos, and logo from updated data
      const {
        location,
        photos: updatedPhotos,
        logo: updatedLogo,
        ...otherData
      } = updatedData

      // Create a copy of the formatted data without complex fields first
      const formattedData = {
        ...otherData,
        updatedAt: Timestamp.now(),
      }

      // --- Handle Logo Update ---
      if (updatedLogo && typeof updatedLogo !== 'string') {
        // If a new logo file is provided (it's a File object)
        // 1. Delete the old logo if it exists
        if (venue.logo) {
          await deleteVenueLogo(venue.logo, venueId)
        }
        // 2. Upload the new logo
        const newLogoUrl = await uploadVenueLogo(
          updatedLogo,
          venueId,
        )
        if (newLogoUrl) {
          formattedData.logo = newLogoUrl
        } else {
          // Handle upload error? Maybe keep old logo?
          // For now, we just won't update the logo field if upload fails
          console.warn(
            'New logo upload failed, keeping previous logo if available.',
          )
          formattedData.logo = venue.logo
        }
      } else if (updatedLogo === null && venue.logo) {
        // If logo was explicitly removed (set to null) and an old logo exists
        await deleteVenueLogo(venue.logo, venueId)
        formattedData.logo = null
      } else if (updatedLogo) {
        // If updatedLogo is a string, it means the existing logo wasn't changed
        formattedData.logo = updatedLogo
      } else {
        // If updatedLogo is null/undefined and there was no old logo, set to null
        formattedData.logo = null
      }

      // --- Handle Location Update --- (Existing logic)
      if (
        location &&
        typeof location.lat === 'number' &&
        typeof location.lng === 'number'
      ) {
        formattedData.location = new GeoPoint(
          location.lat,
          location.lng,
        )
      } else if (!location && venue.location) {
        formattedData.location = venue.location
      }

      // --- Process Photos --- (Existing logic)
      if (updatedPhotos) {
        try {
          // Process deleted photos
          if (venue.photos) {
            const deletedPhotos = venue.photos.filter(
              (photoUrl) =>
                !updatedPhotos.some(
                  (photo) =>
                    typeof photo === 'string' &&
                    photo === photoUrl,
                ),
            )
            for (const photoUrl of deletedPhotos) {
              await deletePhoto(photoUrl)
            }
          }
          // Upload new photos
          const finalPhotoUrls = await uploadPhotos(
            updatedPhotos,
            venueId,
          )
          formattedData.photos = finalPhotoUrls
        } catch (error) {
          console.error('Error processing photos:', error)
          // Keep old photos if processing fails
          formattedData.photos = venue.photos || []
        }
      } else {
        // If photos weren't part of updatedData, ensure existing photos are kept
        formattedData.photos = venue.photos || []
      }

      // Update the venue in Firestore
      await updateDoc(venueRef, formattedData)

      // Also sync to venues_locations collection
      await syncVenueLocationData(venueId, {
        ...formattedData, // Use the fully processed data
        active: formattedData.active !== false, // Ensure active status is carried over
        // Include potentially missing fields needed for sync
        name: formattedData.name || venue.name,
        address: formattedData.address || venue.address,
        city: formattedData.city || venue.city,
        country: formattedData.country || venue.country,
        location: formattedData.location || venue.location,
      })

      // First close the modal
      setIsEditModalOpen(false)

      // Then refresh the venue data
      setTimeout(() => {
        if (refreshVenue) {
          refreshVenue()
        }
      }, 300)
    } catch (error) {
      console.error('Error updating venue:', error)
    }
  }

  const handleEditEvent = async (updatedData) => {
    if (!currentEvent) {
      console.error(
        'Cannot edit event, currentEvent is not set.',
      )
      // Maybe set an error state specific to the edit modal
      alert(
        'Error: No hay evento seleccionado para editar.',
      )
      return
    }
    try {
      // Create a copy for formatting, start with existing data
      let formattedData = {
        ...currentEvent,
        ...updatedData,
      } // Merge updates

      // Format date if changed
      if (
        updatedData.date &&
        updatedData.date !== currentEvent.date // Compare against the formatted string used in the form
      ) {
        try {
          // Convert the ISO string from the form back to a Date object
          const newDate = new Date(updatedData.date)
          if (isNaN(newDate.getTime())) {
            // Validate the date
            throw new Error('Invalid date format')
          }
          formattedData.date = Timestamp.fromDate(newDate) // Convert to Timestamp
        } catch (dateError) {
          console.error(
            'Invalid date format provided for update:',
            updatedData.date,
            dateError,
          )
          alert('Formato de fecha inválido.')
          return // Stop update if date is invalid
        }
      } else if (currentEvent.date) {
        // Keep original timestamp if date string wasn't changed or provided
        // We need to ensure the original Timestamp object is preserved
        // Find the original event from the 'events' state to get the original Timestamp
        const originalEvent = events.find(
          (e) => e.id === currentEvent.id,
        )
        formattedData.date = originalEvent?.date || null // Use original Timestamp or null
      } else {
        // If there was no original date, set to null
        formattedData.date = null
      }

      // Format price if changed
      if (
        updatedData.price !== undefined &&
        updatedData.price !== currentEvent.price
      ) {
        formattedData.price = updatedData.price
          ? parseFloat(Number(updatedData.price).toFixed(2))
          : 0 // Handle empty string or 0
      } else {
        formattedData.price = currentEvent.price // Keep original if not changed
      }

      // Format currency if changed
      formattedData.currency =
        updatedData.currency ||
        currentEvent.currency ||
        'BOB'

      // Format ticketUrl if changed
      if (
        updatedData.ticketUrl !== undefined &&
        updatedData.ticketUrl !== currentEvent.ticketUrl
      ) {
        const trimmedUrl =
          updatedData.ticketUrl?.trim() || null
        // Add validation check using the updated isValidUrl
        if (trimmedUrl && !isValidUrl(trimmedUrl)) {
          alert(
            'El formato de la URL de venta de entradas no es válido.',
          )
          return // Stop update if URL is invalid
        }
        formattedData.ticketUrl = trimmedUrl
      } else {
        formattedData.ticketUrl = currentEvent.ticketUrl // Keep original if not changed
      }

      // Format status if changed
      formattedData.status =
        updatedData.status ||
        currentEvent.status ||
        'active'

      // Add update timestamp
      formattedData.updatedAt = Timestamp.now()

      // --- Handle Image Update ---
      let newImageUrl = formattedData.image // Start with current/updated image value
      const oldImageUrl = currentEvent.image // Store old image URL for potential deletion

      if (updatedData.image instanceof File) {
        // New image uploaded (updatedData.image is a File object)
        console.log('New image file detected for upload.')
        // Consider deleting the old image *before* uploading the new one
        if (oldImageUrl) {
          try {
            // Assuming deleteEventImage exists and works like deletePhoto/deleteVenueLogo
            // await deleteEventImage(oldImageUrl, currentEvent.id);
            console.warn(
              'Deletion of old event image during update not implemented.',
            )
          } catch (deleteError) {
            console.error(
              'Error deleting old event image during update:',
              deleteError,
            )
            // Decide if you want to proceed with upload even if deletion fails
          }
        }

        newImageUrl = await uploadEventImage(
          updatedData.image,
          currentEvent.id,
        )
        if (!newImageUrl) {
          console.warn(
            'New event image upload failed. Keeping previous image if available.',
          )
          newImageUrl = oldImageUrl // Revert to old URL if upload failed
          // Optionally alert the user about the upload failure
          // alert("Error al subir la nueva imagen. Se mantuvo la imagen anterior.");
        }
        formattedData.image = newImageUrl // Update formattedData with the final URL or null
      } else if (
        updatedData.image === null &&
        oldImageUrl
      ) {
        // Image explicitly removed (updatedData.image is null)
        console.log('Event image explicitly removed.')
        if (oldImageUrl) {
          try {
            // await deleteEventImage(oldImageUrl, currentEvent.id);
            console.warn(
              'Deletion of old event image upon removal not implemented.',
            )
          } catch (deleteError) {
            console.error(
              'Error deleting old event image upon removal:',
              deleteError,
            )
            // Optionally alert the user or log
          }
        }
        formattedData.image = null // Ensure it's null in Firestore data
      } else {
        // Image not changed (updatedData.image is same string URL or was already null)
        // Keep the existing value (which is already in formattedData)
        console.log('Event image not changed.')
      }
      // --- End Image Handling ---

      // Remove properties that shouldn't be directly saved or are handled
      const { id, ...dataToUpdate } = formattedData
      // Ensure image is not a File object before saving
      if (dataToUpdate.image instanceof File) {
        console.error(
          'Attempting to save File object to Firestore in handleEditEvent. This should not happen.',
        )
        // Fallback: try to use the old image URL? Or set to null?
        dataToUpdate.image = oldImageUrl
      }

      // --- Update Firestore ---
      const eventRef = doc(db, 'events', currentEvent.id)
      await updateDoc(eventRef, dataToUpdate)

      // --- Update Local State ---
      setEvents(
        events.map((event) =>
          event.id === currentEvent.id
            ? { ...event, ...dataToUpdate } // Use the final dataToUpdate
            : event,
        ),
      )

      // --- Post-Update Actions ---
      setEventSuccess('¡Evento actualizado exitosamente!')
      setTimeout(() => {
        setEventSuccess('')
      }, 3000)

      setIsEventEditModalOpen(false)
      setCurrentEvent(null)
    } catch (error) {
      console.error('Error updating event:', error)
      // Use alert or a dedicated state for edit errors
      alert(
        `Error al actualizar el evento: ${
          error.message || 'Inténtelo de nuevo.'
        }`,
      )
      // Keep modal open on error?
    }
  }

  // Wrapper function for delete confirmation
  const triggerDelete = (eventId, image) => {
    if (
      window.confirm(
        '¿Estás seguro de que deseas eliminar este evento? Esta acción no se puede deshacer.',
      )
    ) {
      deleteEvent(eventId, image)
    }
  }

  const venueFormFields = {
    name: {
      type: 'text',
      label: 'Nombre del sitio',
      required: true,
    },
    logo: {
      type: 'image',
      label: 'Logo',
      accept: 'image/*',
    },
    description: {
      type: 'textarea',
      label: 'Descripción',
      rows: 4,
      required: true,
      maxlength: 999,
    },
    address: {
      type: 'text',
      label: 'Dirección',
      required: true,
    },
    city: {
      type: 'text',
      label: 'Ciudad',
      required: true,
      show: false,
    },
    country: {
      type: 'text',
      label: 'País',
      required: true,
      show: false,
    },
    capacity: {
      type: 'number',
      label: 'Capacidad (personas)',
      min: 1,
    },
    email: {
      type: 'email',
      label: 'Email de contacto',
      required: true,
      show: false,
    },
    facebookUrl: {
      type: 'url',
      label: 'Página de Facebook',
      placeholder: 'https://facebook.com/tu_pagina',
      description: 'Opcional',
    },
    instagramUrl: {
      type: 'url',
      label: 'Perfil de Instagram',
      placeholder: 'https://instagram.com/tu_usuario',
      description: 'Opcional',
    },
    whatsappNumber: {
      type: 'tel',
      label: 'Número de WhatsApp',
      placeholder: '+1234567890 (Incluir código de país)',
      description:
        'Opcional (Incluir código de país ej. +591)',
    },
    location: {
      type: 'map',
      label: 'Ubicación',
      description: 'Selecciona el punto exacto de entrada',
    },
    amenities: {
      type: 'checkboxGroup',
      label: 'Comodidades',
      options: AMENITIES_OPTIONS,
    },
    photos: {
      type: 'photoGallery',
      label: 'Fotos',
      description: 'Máximo 5 fotos',
      maxPhotos: 5,
    },
  }

  const eventFormFields = {
    title: {
      type: 'text',
      label: 'Título del evento',
      required: true,
      maxLength: 100,
    },
    category: {
      type: 'select',
      label: 'Categoría',
      required: true,
      options: CATEGORIES,
    },
    date: {
      type: 'datetime-local',
      label: 'Fecha y hora',
      required: true,
    },
    price: {
      type: 'number',
      label: 'Precio',
      min: 0,
      max: 9999,
      step: '0.01',
      description: 'Deja en 0 si es gratis',
    },
    currency: {
      type: 'select',
      label: 'Moneda',
      required: true,
      options: [
        { value: 'BOB', label: 'Bs (BOB)' },
        { value: 'USD', label: '$ (USD)' },
        { value: 'EUR', label: '€ (EUR)' },
        { value: 'GBP', label: '£ (GBP)' },
        { value: 'BRL', label: 'R$ (BRL)' },
        { value: 'ARS', label: '$ (ARS)' },
        { value: 'CLP', label: '$ (CLP)' },
        { value: 'COP', label: '$ (COP)' },
        { value: 'MXN', label: '$ (MXN)' },
        { value: 'PEN', label: 'S/ (PEN)' },
        { value: 'UYU', label: '$U (UYU)' },
        { value: 'PYG', label: '₲ (PYG)' },
      ],
    },
    ticketUrl: {
      type: 'text',
      label: 'URL de venta de entradas',
      description:
        'Opcional: URL donde se pueden comprar entradas',
    },
    description: {
      type: 'textarea',
      label: 'Descripción',
      rows: 3,
      required: true,
      maxlength: 999,
    },
    image: {
      type: 'image',
      label: 'Imagen',
      description: 'Imagen principal del evento',
      accept: 'image/*',
    },
    status: {
      type: 'select',
      label: 'Estado del evento',
      required: true,
      options: [
        { value: 'active', label: 'Activo' },
        { value: 'cancelled', label: 'Cancelado' },
        { value: 'suspended', label: 'Suspendido' }, // Changed from postponed
      ],
    },
  }

  // Function to open the event edit modal with current event data
  const openEventEditModal = (event) => {
    // Convert Timestamp to ISO string for the datetime-local input
    const date = event.date?.toDate
      ? event.date.toDate().toISOString().slice(0, 16)
      : new Date(event.date).toISOString().slice(0, 16)

    // Make sure ticketUrl is a string
    const ticketUrl = event.ticketUrl || ''

    // Format event data for the form
    const formattedEvent = {
      ...event,
      date,
      ticketUrl,
      currency: event.currency || 'BOB',
      status: event.status || 'active', // Keep default logic
    }

    // image should already be correctly set as a URL string
    // No need to modify it for the form

    // Set current event and open modal
    setCurrentEvent(formattedEvent)
    setIsEventEditModalOpen(true)
  }

  // Function to open the detail modal
  const openDetailModal = (event) => {
    setSelectedEventDetail(event)
    setIsDetailModalOpen(true)
  }

  // Function to close the detail modal
  const closeDetailModal = () => {
    setSelectedEventDetail(null)
    setIsDetailModalOpen(false)
  }

  // Main loading check (uses hook's loading state)
  if (loading) {
    return <DashboardSkeleton />
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  if (!venue) {
    return <DashboardSkeleton /> // Handle case where venue data is still loading or failed
  }

  return (
    <>
      <div className='relative container mx-auto my-24'>
        <Spot colorName={'red'} />
        <Spot colorName={'indigo'} />
        <Spot colorName={'peru'} />
        <div className='bg-gradient-to-r from-teal-500 to-blue-500 rounded-lg shadow-lg p-6 mb-8'>
          <h1 className='text-3xl font-bold text-white'>
            Bienvenid@, personal de:{' '}
            <span className='font-bold text-5xl'>
              {' '}
              {venue.name || 'Cargando nombre...'}{' '}
            </span>
          </h1>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
          <VenueDetailsCard
            venue={venue}
            onEdit={() => setIsEditModalOpen(true)}
          />

          <EventManagementSection
            venueId={venueId}
            venue={venue}
            events={events}
            eventsLoading={eventsLoading}
            filterStatus={filterStatus}
            onFilterChange={setFilterStatus}
            onAddEvent={handleAddEvent}
            onEditEvent={openEventEditModal}
            onDeleteEvent={triggerDelete}
            onViewDetails={openDetailModal}
            eventFormError={eventFormError}
            eventSuccess={eventSuccess}
            setEventFormError={setEventFormError}
            setEventSuccess={setEventSuccess}
          />
        </div>
      </div>

      <EditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleEditVenue}
        fields={venueFormFields}
        title='Editar Local'
        data={venue}
      />

      <EditModal
        isOpen={isEventEditModalOpen}
        onClose={() => setIsEventEditModalOpen(false)}
        onSave={handleEditEvent}
        fields={eventFormFields}
        title='Editar Evento'
        data={currentEvent}
      />

      <EventDetailModal
        isOpen={isDetailModalOpen}
        onClose={closeDetailModal}
        event={selectedEventDetail}
      />

      {/* --- Restore the original Logout Button --- */}
      <div className='w-fit mx-auto p-4'>
        <button
          onClick={async () => {
            try {
              await auth.signOut()
              router.push('/login') // Ensure router is available in this scope
            } catch (error) {
              console.error('Error signing out:', error)
            }
          }}
          className='w-full py-2 px-4 bg-red-500 text-white font-medium rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2'
        >
          Cerrar sesión
        </button>
      </div>
    </>
  )
}

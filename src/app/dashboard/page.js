'use client'

import { useState, useEffect, useMemo } from 'react'
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
import dynamic from 'next/dynamic'
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
  formatWhatsappNumber,
  hasEventPassed,
} from '../../lib/utils'
import VenueEventListItem from '../../components/VenueEventListItem'
import EventDetailModal from '../../components/EventDetailModal'
import Link from 'next/link'
import {
  FaExternalLinkAlt,
  FaFacebook,
  FaInstagram,
  FaRegEye,
  FaWhatsapp,
} from 'react-icons/fa'

const MapComponent = dynamic(
  () => import('../../components/MapComponent'),
  {
    ssr: false,
  },
)

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
  const [eventTitle, setEventTitle] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventDescription, setEventDescription] =
    useState('')
  const [eventCategory, setEventCategory] = useState('')
  const [eventPrice, setEventPrice] = useState('')
  const [eventCurrency, setEventCurrency] = useState('BOB') // Default to Boliviano
  const [eventTicketUrl, setEventTicketUrl] = useState('')
  const [eventImage, setEventImage] = useState(null)
  const [eventFormError, setEventFormError] = useState('')
  const [eventSuccess, setEventSuccess] = useState('')
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [eventsLoading, setEventsLoading] = useState(true)
  const [events, setEvents] = useState([])
  const [venueId, setVenueId] = useState(null)
  const [isEditModalOpen, setIsEditModalOpen] =
    useState(false)
  const [isEventEditModalOpen, setIsEventEditModalOpen] =
    useState(false)
  const [currentEvent, setCurrentEvent] = useState(null)
  const [selectedEventDetail, setSelectedEventDetail] =
    useState(null)

  const [isDetailModalOpen, setIsDetailModalOpen] =
    useState(false)
  const [filterStatus, setFilterStatus] = useState('all') // Change default state to 'all'
  const {
    venue,
    loading: venueLoading,
    error: venueError,
    refreshVenue,
  } = useVenueData(venueId)

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
        // Only set auth loading to false, not events loading
        setLoading(false)
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
  const deleteEvent = async (eventId, featuredImage) => {
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
      setLoading(true)

      // Delete the event from the main events collection
      const eventRef = doc(db, 'events', eventId)
      await deleteDoc(eventRef)

      // Remove event ID from the venue's events array field
      const venueRef = doc(db, 'venues', venueId)
      await updateDoc(venueRef, {
        events: arrayRemove(eventId),
      })

      // Delete the featured image from storage if it exists
      if (featuredImage) {
        try {
          // Use the URL parsing logic directly
          const url = new URL(featuredImage)
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
              featuredImage,
            )
          }
        } catch (error) {
          // Keep this catch block for errors during the URL parsing/deletion attempt
          console.error(
            'Error deleting event image:',
            error,
            'URL:',
            featuredImage,
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
    } finally {
      setLoading(false)
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

  const handleAddEvent = async (e) => {
    e.preventDefault()
    setLoading(true)
    setEventFormError('')
    setEventSuccess('')

    try {
      // Validate required fields
      if (!eventTitle.trim()) {
        throw new Error(
          'El título del evento es obligatorio',
        )
      }

      if (!eventDate) {
        throw new Error(
          'La fecha y hora del evento son obligatorias',
        )
      }

      if (!eventDescription.trim()) {
        throw new Error(
          'La descripción del evento es obligatoria',
        )
      }

      if (!eventCategory) {
        throw new Error(
          'La categoría del evento es obligatoria',
        )
      }

      if (!venueId) {
        throw new Error(
          'No se encontró información del local',
        )
      }

      // Validate date is in the future
      const eventDateTime = new Date(eventDate)
      if (eventDateTime < new Date()) {
        throw new Error(
          'La fecha del evento debe ser en el futuro',
        )
      }

      // Validate URL format if provided
      if (eventTicketUrl && !isValidUrl(eventTicketUrl)) {
        throw new Error(
          'El formato de la URL de venta de entradas no es válido',
        )
      }

      // Create new event data with comprehensive information
      const newEventData = {
        title: eventTitle.trim(),
        description: eventDescription.trim(),
        date: Timestamp.fromDate(new Date(eventDate)),
        category: eventCategory,
        price: eventPrice
          ? parseFloat(Number(eventPrice).toFixed(2))
          : 0,
        currency: eventCurrency,
        ticketUrl: eventTicketUrl
          ? eventTicketUrl.trim()
          : null,
        status: 'active',
        venueId: venueId,
        venueName: venue?.name || '',
        location: venue?.location || null,
        address: venue?.address || '',
        city: venue?.city || '',
        country: venue?.country || '',
        featuredImage: null, // Will be updated after we have the eventId
        capacity: venue?.capacity || null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      }

      // Add the event to Firestore
      const eventId = await addEvent(newEventData)

      // Upload the event image if one was provided, now using the eventId
      let imageUrl = null
      if (eventImage) {
        imageUrl = await uploadEventImage(
          eventImage,
          eventId,
        )

        // Update the event with the image URL
        if (imageUrl) {
          const eventRef = doc(db, 'events', eventId)
          await updateDoc(eventRef, {
            featuredImage: imageUrl,
          })
          newEventData.featuredImage = imageUrl
        }
      }

      // Update local state with new event
      setEvents([
        { id: eventId, ...newEventData },
        ...events,
      ])

      // Reset form fields
      setEventTitle('')
      setEventDate('')
      setEventDescription('')
      setEventCategory('')
      setEventPrice('')
      setEventCurrency('BOB')
      setEventTicketUrl('')
      setEventImage(null)

      // Show success message
      setEventSuccess('¡Evento agregado exitosamente!')

      // Scroll to top of form
      document
        .getElementById('eventTitle')
        ?.scrollIntoView({ behavior: 'smooth' })

      // Clear success message after 5 seconds
      setTimeout(() => {
        setEventSuccess('')
      }, 5000)
    } catch (error) {
      setEventFormError(
        error.message ||
          'Error al agregar el evento. Inténtelo de nuevo.',
      )

      // Scroll to error message
      document
        .querySelector('form')
        ?.scrollIntoView({ behavior: 'smooth' })
    } finally {
      setLoading(false)
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

      setLoading(true)
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
    } finally {
      setLoading(false)
    }
  }

  const handleEditEvent = async (updatedData) => {
    try {
      setLoading(true)

      // Create a copy of the data for formatting
      let formattedData = {
        ...updatedData,
        // Format date properly from datetime-local input to Firestore Timestamp
        date: updatedData.date
          ? Timestamp.fromDate(new Date(updatedData.date))
          : currentEvent.date,
        // Format price as number with 2 decimal places
        price:
          updatedData.price !== undefined
            ? parseFloat(
                Number(updatedData.price).toFixed(2),
              )
            : currentEvent.price,
        // Ensure currency is properly set
        currency:
          updatedData.currency ||
          currentEvent.currency ||
          'BOB',
        // Format ticketUrl to null if empty
        ticketUrl:
          updatedData.ticketUrl &&
          updatedData.ticketUrl.trim() !== ''
            ? updatedData.ticketUrl.trim()
            : null,
        // Add a timestamp for the update
        updatedAt: Timestamp.now(),
      }

      // Handle image upload if a new image was provided
      if (
        updatedData.featuredImage &&
        typeof updatedData.featuredImage !== 'string'
      ) {
        // If the image is a File object (new upload), upload it
        const imageUrl = await uploadEventImage(
          updatedData.featuredImage,
          currentEvent.id,
        )
        if (imageUrl) {
          formattedData.featuredImage = imageUrl
        }
      } else if (updatedData.featuredImage === null) {
        // If the image was explicitly set to null (removed), set it to null
        formattedData.featuredImage = null
      }
      // Otherwise, keep the existing image URL (it's already a string)

      // Update event in the main events collection
      const eventRef = doc(db, 'events', currentEvent.id)
      await updateDoc(eventRef, formattedData)

      // Update the local state
      setEvents(
        events.map((event) =>
          event.id === currentEvent.id
            ? { ...event, ...formattedData }
            : event,
        ),
      )

      // Show success message
      setEventSuccess('¡Evento actualizado exitosamente!')
      setTimeout(() => {
        setEventSuccess('')
      }, 3000)

      // Close the modal and reset current event
      setIsEventEditModalOpen(false)
      setCurrentEvent(null)
    } catch (error) {
      console.error('Error updating event:', error)
      setEventFormError(
        error.message ||
          'Error al actualizar el evento. Inténtelo de nuevo.',
      )
    } finally {
      setLoading(false)
    }
  }

  // Wrapper function for delete confirmation
  const triggerDelete = (eventId, featuredImage) => {
    if (
      window.confirm(
        '¿Estás seguro de que deseas eliminar este evento? Esta acción no se puede deshacer.',
      )
    ) {
      deleteEvent(eventId, featuredImage)
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
      type: 'url',
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
    featuredImage: {
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
    console.log(event)
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

    // featuredImage should already be correctly set as a URL string
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

  // Filter events based on the selected status
  const filteredEvents = useMemo(() => {
    if (!events) return []
    return events.filter((event) => {
      const isPast = hasEventPassed(event.date)
      const status = event.status || 'active'

      switch (filterStatus) {
        case 'suspended': // Changed from postponed
          return status === 'suspended'
        case 'cancelled':
          return status === 'cancelled'
        case 'past':
          // Show only past events that aren't cancelled or suspended
          return (
            isPast &&
            status !== 'cancelled' &&
            status !== 'suspended'
          )
        case 'active':
          // Show only upcoming events that aren't cancelled or suspended
          return (
            !isPast &&
            status !== 'cancelled' &&
            status !== 'suspended'
          )
        case 'all':
        default:
          return true // Show all
      }
    })
  }, [events, filterStatus])

  if (loading || venueLoading) {
    return (
      <div className='min-h-screen flex justify-center items-center bg-gray-50'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500 mx-auto mb-4'></div>
          <p className='text-gray-600'>
            Cargando información...
          </p>
        </div>
      </div>
    )
  }

  if (venueError) {
    return <div>Error: {venueError}</div>
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
              {venue.name}{' '}
            </span>
          </h1>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
          <div className='bg-white rounded-lg shadow-lg p-6'>
            <h2 className='text-2xl font-semibold mb-4 text-gray-800 flex items-center justify-between'>
              <div className='flex items-center'>
                <svg
                  className='w-6 h-6 mr-2'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'
                  />
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M15 11a3 3 0 11-6 0 3 3 0 016 0z'
                  />
                </svg>
                Mi espacio
              </div>
              <button
                className='text-teal-600 hover:text-teal-800'
                onClick={() => setIsEditModalOpen(true)}
              >
                <svg
                  className='w-5 h-5'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z'
                  />
                </svg>
              </button>
            </h2>

            {/* Logo and venue name */}
            {venue.logo && (
              <div className='flex items-center mb-4'>
                <div className='flex items-center'>
                  <img
                    src={venue.logo}
                    alt={`Logo de ${venue.name}`}
                    className='w-20 h-20 object-cover rounded-full border-2 border-teal-500 shadow-md mr-4'
                  />
                  <h3 className='text-xl font-bold text-gray-800'>
                    {venue.name}
                  </h3>
                </div>
              </div>
            )}

            {/* Map */}
            <div className='rounded-lg overflow-hidden mb-4 relative'>
              <MapComponent
                venues={[venue]}
                center={[
                  venue.location.latitude,
                  venue.location.longitude,
                ]}
                zoom={15}
                small={true}
                isDashboard={true}
                mapId='dashboard-map'
              />
            </div>

            {/* Location info */}
            <div className='bg-gray-50 p-4 rounded-lg mb-4'>
              <h3 className='font-semibold text-gray-700 mb-2'>
                <span>Ubicación</span>
              </h3>
              <p className='text-sm text-gray-500 flex items-center gap-2 mb-2'>
                <svg
                  className='w-4 h-4'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'
                  />
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M15 11a3 3 0 11-6 0 3 3 0 016 0z'
                  />
                </svg>
                {venue.address}
              </p>
              {venue.city && venue.country && (
                <p className='text-sm text-gray-500 flex items-center gap-2'>
                  <svg
                    className='w-4 h-4'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <circle
                      cx='12'
                      cy='12'
                      r='10'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                    />
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z'
                    />
                  </svg>
                  {venue.city}, {venue.country}
                </p>
              )}
            </div>

            {/* Description */}
            <div className='bg-gray-50 p-4 rounded-lg mb-4'>
              <h3 className='font-semibold text-gray-700 mb-2'>
                <span>Descripción</span>
              </h3>
              <p className='text-sm text-gray-500 flex items-start gap-2'>
                <svg
                  className='w-4 h-4 mt-1 flex-shrink-0'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M4 4h16v16H4z'
                  />
                  <line
                    x1='8'
                    y1='8'
                    x2='16'
                    y2='8'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                  />
                  <line
                    x1='8'
                    y1='12'
                    x2='16'
                    y2='12'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                  />
                  <line
                    x1='8'
                    y1='16'
                    x2='12'
                    y2='16'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                  />
                </svg>
                <span>{venue.description}</span>
              </p>
            </div>

            {/* Capacity */}
            {venue.capacity != null && ( // Keep the check if capacity exists at all
              <div className='bg-gray-50 p-4 rounded-lg mb-4'>
                <h3 className='font-semibold text-gray-700 mb-2'>
                  <span>Capacidad</span>
                </h3>
                <p className='text-sm text-gray-500 flex items-center gap-2'>
                  <svg
                    className='w-4 h-4'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
                    />
                  </svg>
                  {/* Conditional display based on capacity value */}
                  {venue.capacity < 2 ? (
                    <span className='italic text-gray-400'>
                      Aun no has especificado la capacidad
                      maxima
                    </span>
                  ) : (
                    `${venue.capacity} personas`
                  )}
                </p>
              </div>
            )}

            {/* Amenities */}
            {venue.amenities &&
              venue.amenities.length > 0 && (
                <div className='bg-gray-50 p-4 rounded-lg mb-4'>
                  <h3 className='font-semibold text-gray-700 mb-2'>
                    <span>Comodidades</span>
                  </h3>
                  <div className='flex flex-wrap gap-2'>
                    {venue.amenities.map(
                      (amenity, index) => (
                        <span
                          key={index}
                          className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800'
                        >
                          <svg
                            className='w-3 h-3 mr-1'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M5 13l4 4L19 7'
                            />
                          </svg>
                          {amenity}
                        </span>
                      ),
                    )}
                  </div>
                </div>
              )}

            {/* Contact */}
            {venue.email && (
              <div className='bg-gray-50 p-4 rounded-lg mb-4'>
                <h3 className='font-semibold text-gray-700 mb-2'>
                  <span>
                    Contacto{' '}
                    <small className='font-normal'>
                      (sólo para Radart, no será visible
                      hacia el público)
                    </small>
                  </span>
                </h3>
                <p className='text-sm text-gray-500 flex items-center gap-2'>
                  <svg
                    className='w-4 h-4'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2z'
                    />
                  </svg>
                  {venue.email}
                </p>
              </div>
            )}

            {/* Social Media / WhatsApp */}
            {(venue.facebookUrl ||
              venue.instagramUrl ||
              venue.whatsappNumber) && (
              <div className='bg-gray-50 p-4 rounded-lg mb-4'>
                <h3 className='font-semibold text-gray-700 mb-2'>
                  <span>Redes Sociales / WhatsApp</span>
                </h3>
                <div className='space-y-2'>
                  {venue.facebookUrl && (
                    <p className='text-sm text-gray-500 flex items-center gap-2'>
                      <a
                        href={venue.facebookUrl}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='flex items-center gap-2 text-[var(--facebook)] hover:underline'
                        title={venue.facebookUrl}
                      >
                        <FaFacebook className='w-5 h-5' />{' '}
                        {/* Use React Icon */}
                        <span className='truncate'>
                          Facebook
                        </span>
                      </a>
                    </p>
                  )}
                  {venue.instagramUrl && (
                    <p className='text-sm text-gray-500 flex items-center gap-2'>
                      {venue.instagramUrl && (
                        <a
                          href={venue.instagramUrl}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='flex items-center gap-2 text-[var(--instagram)] hover:underline '
                          title={venue.instagramUrl}
                        >
                          <FaInstagram className='w-5 h-5' />{' '}
                          {/* Use React Icon */}
                          <span className='truncate'>
                            Instagram
                          </span>
                        </a>
                      )}
                    </p>
                  )}
                  {venue.whatsappNumber && (
                    <p className='text-sm text-gray-500 flex items-center gap-2'>
                      {venue.whatsappNumber && (
                        <a
                          href={`https://wa.me/${venue.whatsappNumber}`}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='flex items-center gap-2 text-[var(--whatsapp)] hover:underline'
                          title={`WhatsApp ${venue.whatsappNumber}`}
                        >
                          <FaWhatsapp className='w-5 h-5' />{' '}
                          {/* Use React Icon */}
                          <span className='truncate'>
                            WhatsApp
                          </span>
                          {formatWhatsappNumber(
                            venue.whatsappNumber,
                          )}
                        </a>
                      )}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Photos gallery */}
            {venue.photos && venue.photos.length > 0 && (
              <div className='mt-4'>
                <h3 className='font-semibold text-gray-700 mb-2'>
                  <span>Fotos</span>
                </h3>
                <div className='flex flex-col gap-2'>
                  {/* First row - first 3 photos */}
                  <div className='grid grid-cols-3 gap-2'>
                    {venue.photos
                      .slice(0, 3)
                      .map((photo, index) => (
                        <img
                          key={index}
                          src={photo}
                          alt={`Foto ${index + 1} de ${
                            venue.name
                          }`}
                          className='w-full h-36 object-cover rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200'
                        />
                      ))}
                  </div>
                  {/* Second row - next 2 photos */}
                  {venue.photos.length > 3 && (
                    <div className='grid grid-cols-2 gap-2 m-auto'>
                      {venue.photos
                        .slice(3, 5)
                        .map((photo, index) => (
                          <img
                            key={index + 3}
                            src={photo}
                            alt={`Foto ${index + 4} de ${
                              venue.name
                            }`}
                            className='w-full h-36 object-cover rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200'
                          />
                        ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* Link to public venue page */}
            <div className='mt-32 text-center'>
              <Link
                href={`/venues/${venue.id}`}
                className='inline-flex items-center gap-2 justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[var(--blue-500)] hover:brightness-125 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary)] transition-all duration-200'
              >
                <span>Ver Página Pública del Local</span>
                <FaRegEye />
              </Link>
            </div>
          </div>

          <div className='bg-white rounded-lg shadow-lg p-6'>
            <h2 className='text-2xl font-semibold mb-4 text-gray-800 flex items-center'>
              <svg
                className='w-6 h-6 mr-2'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
                />
              </svg>
              Mis eventos
            </h2>
            <form
              onSubmit={handleAddEvent}
              className='my-6 bg-white rounded-lg shadow-sm'
            >
              <h3 className='text-lg font-semibold w-fit text-gray-800 my-4 border-b pb-2'>
                Crear Nuevo Evento
              </h3>

              {/* Error message */}
              {eventFormError && (
                <div className='bg-red-50 border-l-4 border-red-500 p-4 mb-4'>
                  <p className='text-red-700 text-sm'>
                    {eventFormError}
                  </p>
                </div>
              )}

              {/* Success message */}
              {eventSuccess && (
                <div className='bg-green-50 border-l-4 border-green-500 p-4 mb-4'>
                  <p className='text-green-700 text-sm'>
                    {eventSuccess}
                  </p>
                </div>
              )}

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                {/* Title field */}
                <div className='col-span-2'>
                  <label
                    htmlFor='eventTitle'
                    className='block text-sm font-medium text-gray-700 mb-1'
                  >
                    Título del evento{' '}
                    <span className='text-red-500'>*</span>
                  </label>
                  <input
                    id='eventTitle'
                    type='text'
                    placeholder='Ej: Concierto de Jazz'
                    value={eventTitle}
                    onChange={(e) =>
                      setEventTitle(e.target.value)
                    }
                    className='w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent'
                    required
                  />
                </div>

                {/* Category field */}
                <div>
                  <label
                    htmlFor='eventCategory'
                    className='block text-sm font-medium text-gray-700 mb-1'
                  >
                    Categoría{' '}
                    <span className='text-red-500'>*</span>
                  </label>
                  <select
                    id='eventCategory'
                    value={eventCategory}
                    onChange={(e) =>
                      setEventCategory(e.target.value)
                    }
                    className='w-full p-2 border bg-white border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent'
                    required
                  >
                    <option value=''>
                      Seleccionar categoría
                    </option>
                    {CATEGORIES.map((category) => (
                      <option
                        key={category.value}
                        value={category.value}
                      >
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date and time field */}
                <div>
                  <label
                    htmlFor='eventDate'
                    className='block text-sm font-medium text-gray-700 mb-1'
                  >
                    Fecha y hora{' '}
                    <span className='text-red-500'>*</span>
                  </label>
                  <input
                    id='eventDate'
                    type='datetime-local'
                    value={eventDate}
                    onChange={(e) =>
                      setEventDate(e.target.value)
                    }
                    className='w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent'
                    required
                  />
                </div>

                {/* Price field */}
                <div>
                  <label
                    htmlFor='eventPrice'
                    className='block text-sm font-medium text-gray-700 mb-1'
                  >
                    Precio
                  </label>
                  <div className='flex gap-7 md:gap-2 '>
                    <div className='relative flex-1'>
                      <input
                        id='eventPrice'
                        type='number'
                        min='0'
                        max={9999}
                        step='0.5'
                        placeholder='0.00'
                        value={eventPrice}
                        onChange={(e) =>
                          setEventPrice(e.target.value)
                        }
                        className='w-full min-w-20 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent '
                      />
                    </div>
                    <select
                      id='eventCurrency'
                      value={eventCurrency}
                      onChange={(e) =>
                        setEventCurrency(e.target.value)
                      }
                      className='w-24 p-2 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent'
                    >
                      <option value='BOB'>Bs (BOB)</option>
                      <option value='USD'>$ (USD)</option>
                      <option value='EUR'>€ (EUR)</option>
                      <option value='GBP'>£ (GBP)</option>
                      <option value='BRL'>R$ (BRL)</option>
                      <option value='ARS'>$ (ARS)</option>
                      <option value='CLP'>$ (CLP)</option>
                      <option value='COP'>$ (COP)</option>
                      <option value='MXN'>$ (MXN)</option>
                      <option value='PEN'>S/ (PEN)</option>
                      <option value='UYU'>$U (UYU)</option>
                      <option value='PYG'>₲ (PYG)</option>
                    </select>
                  </div>
                  <p className='text-xs text-gray-500 mt-1'>
                    Deja en blanco si es gratis
                  </p>
                </div>

                {/* Ticket URL field */}
                <div className='col-span-2'>
                  <label
                    htmlFor='eventTicketUrl'
                    className='block text-sm font-medium text-gray-700 mb-1'
                  >
                    URL de venta de entradas
                  </label>
                  <input
                    id='eventTicketUrl'
                    type='url'
                    placeholder='https://ejemplo.com/tickets'
                    value={eventTicketUrl}
                    onChange={(e) =>
                      setEventTicketUrl(e.target.value)
                    }
                    className='w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent'
                  />
                  <p className='text-xs text-gray-500 mt-1'>
                    Opcional: URL donde se pueden comprar
                    entradas
                  </p>
                </div>

                {/* Description field */}
                <div className='col-span-2'>
                  <label
                    htmlFor='eventDescription'
                    className='block text-sm font-medium text-gray-700 mb-1'
                  >
                    Descripción{' '}
                    <span className='text-red-500'>*</span>
                  </label>
                  <textarea
                    id='eventDescription'
                    rows='4'
                    placeholder='Describe el evento, artistas, horarios, etc.'
                    value={eventDescription}
                    onChange={(e) =>
                      setEventDescription(e.target.value)
                    }
                    className='w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent'
                    required
                    maxLength={999}
                  ></textarea>
                  <p className='text-xs text-gray-500 text-right mt-1'>
                    {eventDescription.length} / 999
                  </p>
                </div>

                {/* Featured image field */}
                <div className='col-span-2'>
                  <label
                    htmlFor='eventImage'
                    className='block text-sm font-medium text-gray-700 mb-1'
                  >
                    Imagen
                  </label>
                  <div className='flex items-center gap-4'>
                    <input
                      id='eventImage'
                      type='file'
                      accept='image/*'
                      onChange={(e) => {
                        if (
                          e.target.files &&
                          e.target.files[0]
                        ) {
                          setEventImage(e.target.files[0])
                        }
                      }}
                      className='flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent'
                    />
                    {eventImage && (
                      <div className='h-16 w-16 relative border rounded overflow-hidden'>
                        <img
                          src={URL.createObjectURL(
                            eventImage,
                          )}
                          alt='Vista previa'
                          className='h-full w-full object-cover'
                        />
                        <button
                          type='button'
                          onClick={() =>
                            setEventImage(null)
                          }
                          className='absolute top-0 right-0 bg-red-500 text-white p-1 rounded-bl'
                        >
                          <svg
                            className='w-3 h-3'
                            fill='none'
                            viewBox='0 0 24 24'
                            stroke='currentColor'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M6 18L18 6M6 6l12 12'
                            />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                  <p className='text-xs text-gray-500 mt-1'>
                    Recomendado: imagen en formato 16:9 para
                    mejor visualización
                  </p>
                </div>
              </div>

              {/* Submit button */}
              <div className='mt-8'>
                <button
                  type='submit'
                  disabled={loading}
                  className='w-full py-3 px-4 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-medium rounded-md hover:from-teal-600 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition duration-200 disabled:opacity-70 disabled:cursor-not-allowed'
                >
                  <span className='flex items-center justify-center'>
                    {loading ? (
                      <>
                        <svg
                          className='animate-spin -ml-1 mr-2 h-4 w-4 text-white'
                          xmlns='http://www.w3.org/2000/svg'
                          fill='none'
                          viewBox='0 0 24 24'
                        >
                          <circle
                            className='opacity-25'
                            cx='12'
                            cy='12'
                            r='10'
                            stroke='currentColor'
                            strokeWidth='4'
                          ></circle>
                          <path
                            className='opacity-75'
                            fill='currentColor'
                            d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                          ></path>
                        </svg>
                        Procesando...
                      </>
                    ) : (
                      <>
                        <svg
                          className='w-5 h-5 mr-2'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M12 6v6m0 0v6m0-6h6m-6 0H6'
                          />
                        </svg>
                        Agregar evento
                      </>
                    )}
                  </span>
                </button>
              </div>
            </form>

            <h3 className='text-lg font-semibold w-fit text-gray-800 mb-4 border-b pb-2'>
              Listado de eventos
            </h3>

            {/* Filter Buttons */}
            {!eventsLoading && events.length > 0 && (
              <div className='flex flex-wrap gap-2 mb-4 border-b pb-4'>
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-3 py-1 rounded-md text-sm ${
                    filterStatus === 'all'
                      ? 'bg-teal-600 text-white shadow'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setFilterStatus('active')}
                  className={`px-3 py-1 rounded-md text-sm ${
                    filterStatus === 'active'
                      ? 'bg-teal-600 text-white shadow'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  Próximos
                </button>
                <button
                  onClick={() => setFilterStatus('past')}
                  className={`px-3 py-1 rounded-md text-sm ${
                    filterStatus === 'past'
                      ? 'bg-teal-600 text-white shadow'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  Pasados
                </button>
                <button
                  onClick={() =>
                    setFilterStatus('suspended')
                  }
                  className={`px-3 py-1 rounded-md text-sm ${
                    filterStatus === 'suspended'
                      ? 'bg-teal-600 text-white shadow'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  Suspendidos
                </button>
                <button
                  onClick={() =>
                    setFilterStatus('cancelled')
                  }
                  className={`px-3 py-1 rounded-md text-sm ${
                    filterStatus === 'cancelled'
                      ? 'bg-teal-600 text-white shadow'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  Cancelados
                </button>
              </div>
            )}

            {eventsLoading ? (
              <div className='text-center py-8'>
                <div className='animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500 mx-auto mb-4'></div>
                <p className='text-gray-500'>
                  Cargando eventos...
                </p>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className='text-center py-8 text-gray-500'>
                <svg
                  className='w-16 h-16 mx-auto mb-4'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
                  />
                </svg>
                <p>
                  No hay eventos que coincidan con el filtro
                  seleccionado.
                </p>
                {events.length > 0 &&
                  filterStatus !== 'all' && (
                    <button
                      onClick={() => setFilterStatus('all')}
                      className='mt-4 text-sm text-teal-600 hover:underline'
                    >
                      Mostrar todos los eventos
                    </button>
                  )}
              </div>
            ) : (
              <ul className='space-y-3 mb-6'>
                {filteredEvents.map((event) => (
                  <VenueEventListItem
                    key={event.id}
                    event={event}
                    onEdit={() => openEventEditModal(event)}
                    onDelete={() =>
                      triggerDelete(
                        event.id,
                        event.featuredImage,
                      )
                    }
                    isIndexPage
                    onClickItem={openDetailModal}
                  />
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <EditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title='Editar información'
        data={venue}
        fields={venueFormFields}
        onSave={handleEditVenue}
      />

      <EditModal
        isOpen={isEventEditModalOpen}
        onClose={() => {
          setIsEventEditModalOpen(false)
          setCurrentEvent(null)
        }}
        title='Editar evento'
        data={currentEvent}
        fields={eventFormFields}
        onSave={handleEditEvent}
        saveButtonText='Actualizar Evento'
      />

      <EventDetailModal
        isOpen={isDetailModalOpen}
        onClose={closeDetailModal}
        event={selectedEventDetail}
      />

      <div className='w-fit mx-auto p-4'>
        <button
          onClick={async () => {
            try {
              await auth.signOut()
              router.push('/login')
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

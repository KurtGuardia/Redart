import { useState, useEffect, useCallback } from 'react'
import { Timestamp } from 'firebase/firestore' // Needed for data formatting if preparing data inside hook
import {
  fetchVenueEvents,
  addEvent as addEventService,
  updateEventDetails as updateEventService,
  deleteEvent as deleteEventService,
} from '../lib/firebaseService'
import { isValidUrl } from '../lib/utils' // For validation if done within hook actions

export const useVenueEvents = (venueId, venue) => {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState('')

  // Debounce success message clearing
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('')
      }, 3000) // Clear after 3 seconds
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  // Fetch events when venueId changes
  useEffect(() => {
    if (!venueId) {
      setEvents([])
      setLoading(false)
      return
    }

    const loadEvents = async () => {
      setLoading(true)
      setError(null)
      try {
        const fetchedEvents = await fetchVenueEvents(
          venueId,
        )
        setEvents(fetchedEvents)
      } catch (err) {
        console.error(
          'useVenueEvents - Error fetching events:',
          err,
        )
        setError('Error al cargar los eventos.')
        setEvents([])
      } finally {
        setLoading(false)
      }
    }

    loadEvents()
  }, [venueId])

  // Add Event Handler
  const addEvent = useCallback(
    async (formData, imageFile) => {
      if (!venueId || !venue) {
        setError(
          'Error: No se pudo identificar el local (venueId).',
        )
        return false
      }
      setLoading(true)
      setError(null)
      setSuccessMessage('')

      try {
        // --- Validation (moved from component) ---
        if (!formData.title?.trim())
          throw new Error(
            'El título del evento es obligatorio',
          )
        if (!formData.date)
          throw new Error(
            'La fecha y hora del evento son obligatorias',
          )
        const eventDateTime = new Date(formData.date)
        if (isNaN(eventDateTime.getTime()))
          throw new Error(
            'Formato de fecha y hora inválido',
          )
        if (eventDateTime < new Date())
          throw new Error(
            'La fecha del evento debe ser en el futuro',
          )
        if (!formData.description?.trim())
          throw new Error(
            'La descripción del evento es obligatoria',
          )
        if (!formData.category)
          throw new Error(
            'La categoría del evento es obligatoria',
          )
        if (
          formData.ticketUrl &&
          !isValidUrl(formData.ticketUrl)
        )
          throw new Error(
            'El formato de la URL de venta de entradas no es válido',
          )
        if (
          formData.duration &&
          isNaN(Number(formData.duration))
        )
          throw new Error(
            'La duración del evento debe ser un número válido',
          )

        // --- Prepare Event Data for Service ---
        const newEventData = {
          title: formData.title.trim(),
          description: formData.description.trim(),
          date: Timestamp.fromDate(eventDateTime),
          duration: formData.duration
            ? Number(formData.duration)
            : null,
          category: formData.category,
          price: formData.price
            ? parseFloat(Number(formData.price).toFixed(2))
            : 0,
          currency: formData.currency || 'BOB',
          ticketUrl: formData.ticketUrl
            ? formData.ticketUrl.trim()
            : null,
          status: 'active',
          venueName: venue?.name || '',
          location: venue?.location || null,
          address: venue?.address || '',
          city: venue?.city || '',
          country: venue?.country || '',
          capacity: venue?.capacity || null,
        }

        // Call service
        const addedEvent = await addEventService(
          venueId,
          newEventData,
          imageFile,
        )

        // Update local state
        setEvents((prevEvents) => [
          addedEvent,
          ...prevEvents,
        ])
        setSuccessMessage('¡Evento agregado exitosamente!')
        return true // Signal success
      } catch (err) {
        console.error(
          'useVenueEvents - Error adding event:',
          err,
        )
        setError(
          err.message || 'Error al agregar el evento.',
        )
        return false // Signal failure
      } finally {
        setLoading(false)
      }
    },
    [venueId, venue],
  ) // Dependencies: venueId and venue data used

  // Update Event Handler
  const updateEvent = useCallback(
    async (
      eventId,
      updatedDataFromModal,
      currentEventData,
    ) => {
      if (!eventId || !venueId || !currentEventData) {
        setError(
          'Error: Datos incompletos para actualizar evento.',
        )
        return false
      }
      const originalEvent = events.find(
        (e) => e.id === eventId,
      ) // Find original for comparison
      if (!originalEvent) {
        setError('Error: Evento original no encontrado.')
        return false
      }

      setLoading(true)
      setError(null)
      setSuccessMessage('')

      try {
        // --- Prepare Data (moved from component) ---
        const { image: imageInput, ...otherUpdates } =
          updatedDataFromModal
        let newImageFile = undefined
        if (imageInput instanceof File)
          newImageFile = imageInput
        else if (imageInput === null) newImageFile = null

        let dateToSave = originalEvent.date
        if (
          otherUpdates.date &&
          otherUpdates.date !== currentEventData.date
        ) {
          const newDate = new Date(otherUpdates.date)
          if (isNaN(newDate.getTime()))
            throw new Error('Formato de fecha inválido')
          dateToSave = Timestamp.fromDate(newDate)
        }

        const priceToSave =
          otherUpdates.price !== undefined
            ? parseFloat(
                Number(otherUpdates.price).toFixed(2),
              ) || 0
            : originalEvent.price

        let ticketUrlToSave = originalEvent.ticketUrl
        if (otherUpdates.ticketUrl !== undefined) {
          const trimmedUrl =
            otherUpdates.ticketUrl?.trim() || null
          if (trimmedUrl && !isValidUrl(trimmedUrl)) {
            throw new Error(
              'El formato de la URL de venta de entradas no es válido.',
            )
          }
          ticketUrlToSave = trimmedUrl
        }

        const dataForService = {
          ...otherUpdates,
          date: dateToSave,
          price: priceToSave,
          ticketUrl: ticketUrlToSave,
          currency:
            otherUpdates.currency ||
            originalEvent.currency ||
            'BOB',
          status:
            otherUpdates.status ||
            originalEvent.status ||
            'active',
        }
        delete dataForService.id
        const oldImageUrl = originalEvent.image || null

        // Call service
        const updatedEvent = await updateEventService(
          eventId,
          dataForService,
          oldImageUrl,
          newImageFile,
          venueId,
        )

        // Update local state
        setEvents((prevEvents) =>
          prevEvents.map((event) =>
            event.id === eventId ? updatedEvent : event,
          ),
        )
        setSuccessMessage(
          '¡Evento actualizado exitosamente!',
        )
        return true // Signal success
      } catch (err) {
        console.error(
          `useVenueEvents - Error updating event ${eventId}:`,
          err,
        )
        setError(
          err.message || 'Error al actualizar el evento.',
        )
        return false // Signal failure
      } finally {
        setLoading(false)
      }
    },
    [venueId, events],
  ) // Dependency: events array for finding original

  // Delete Event Handler
  const deleteEvent = useCallback(
    async (eventId, imageUrl) => {
      if (!venueId || !eventId) {
        setError(
          'Error: Datos incompletos para eliminar evento.',
        )
        return false
      }

      // Confirmation could be handled here or in the component
      // if (window.confirm('Are you sure?')) { ... }

      setLoading(true)
      setError(null)
      setSuccessMessage('')

      try {
        // Call service
        await deleteEventService(venueId, eventId, imageUrl)

        // Update local state
        setEvents((prevEvents) =>
          prevEvents.filter(
            (event) => event.id !== eventId,
          ),
        )
        setSuccessMessage('¡Evento eliminado exitosamente!')
        return true // Signal success
      } catch (err) {
        console.error(
          `useVenueEvents - Error deleting event ${eventId}:`,
          err,
        )
        setError('Error al eliminar el evento.')
        return false // Signal failure
      } finally {
        setLoading(false)
      }
    },
    [venueId],
  )

  // Function to manually clear error/success messages if needed
  const clearMessages = useCallback(() => {
    setError(null)
    setSuccessMessage('')
  }, [])

  return {
    events,
    loading,
    error,
    successMessage,
    addEvent,
    updateEvent,
    deleteEvent,
    clearMessages, // Expose function to clear messages manually
    // filterStatus state and setFilterStatus could also be managed here if desired
  }
}

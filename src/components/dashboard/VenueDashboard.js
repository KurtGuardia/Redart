'use client'

import { useState } from 'react'
import { useVenueData } from '../../hooks/useVenueData'
import { useVenueEvents } from '../../hooks/useVenueEvents'
import { useVenueActions } from '../../hooks/useVenueActions'
import EditModal from '../../components/EditModal'
import {
  venueFormFields,
  eventFormFields,
} from '../../lib/constants'
import VenueDetailsCard from './VenueDetailsCard'
import EventManagementSection from './EventManagementSection'

export default function VenueDashboard({ venueId }) {
  const [isEditModalOpen, setIsEditModalOpen] =
    useState(false)
  const [isEventEditModalOpen, setIsEventEditModalOpen] =
    useState(false)
  const [currentEvent, setCurrentEvent] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')

  const {
    venue,
    loading: venueLoading,
    error: venueError,
    refreshVenue,
  } = useVenueData(venueId)

  const {
    updateVenue,
    loading: venueUpdateLoading,
    error: venueUpdateError,
  } = useVenueActions(venueId, venue, refreshVenue)

  const {
    events,
    loading: eventsLoading,
    error: eventError,
    successMessage: eventSuccess,
    addEvent,
    updateEvent,
    deleteEvent,
    clearMessages: clearEventMessages,
  } = useVenueEvents(venueId, venue)

  const openEventEditModal = (event) => {
    if (!event || !event.id) {
      console.error(
        'Cannot open edit modal: Invalid event data provided.',
        event,
      )
      return
    }
    let isoDateString = ''
    if (event.date) {
      try {
        const dateObj = event.date.toDate
          ? event.date.toDate()
          : new Date(event.date)
        if (!isNaN(dateObj.getTime())) {
          const year = dateObj.getFullYear()
          const month = String(
            dateObj.getMonth() + 1,
          ).padStart(2, '0')
          const day = String(dateObj.getDate()).padStart(
            2,
            '0',
          )
          const hours = String(dateObj.getHours()).padStart(
            2,
            '0',
          )
          const minutes = String(
            dateObj.getMinutes(),
          ).padStart(2, '0')
          isoDateString = `${year}-${month}-${day}T${hours}:${minutes}`
        }
      } catch (e) {
        console.error(
          'Error formatting date for event modal:',
          e,
        )
      }
    }
    const ticketUrl = event.ticketUrl || ''
    const formattedEvent = {
      ...event,
      id: event.id,
      date: isoDateString,
      ticketUrl,
      currency: event.currency || 'BOB',
      status: event.status || 'active',
    }
    setCurrentEvent(formattedEvent)
    setIsEventEditModalOpen(true)
  }

  const confirmAndDeleteEvent = (eventId, image) => {
    if (
      window.confirm(
        '¿Estás seguro de que deseas eliminar este evento? Esta acción no se puede deshacer.',
      )
    ) {
      deleteEvent(eventId, image)
    }
  }

  const isLoading =
    venueLoading || eventsLoading || venueUpdateLoading
  const displayError =
    venueError || eventError || venueUpdateError

  if (displayError && !isLoading && !venue) {
    // Handle case where initial load failed but maybe subsequent actions have errors
    return <div>Error: {displayError}</div>
  }

  if ((eventError || venueUpdateError) && venue) {
    console.error(
      'Error in VenueDashboard (events or update):',
      eventError || venueUpdateError,
    )
    // Display these errors via toast or inline messages within the rendered dashboard below.
  }

  return (
    <>
      {/* Header section */}
      <div className='bg-gradient-to-r from-teal-500 to-blue-500 rounded-lg shadow-lg p-6 mb-8'>
        <h1 className='text-3xl 2xl:text-6xl font-bold text-white'>
          Bienvenid@, personal de:{' '}
          <span className='font-bold text-4xl 2xl:text-7xl drop-shadow-lg'>
            {' '}
            {venue?.name || 'Cargando nombre...'}{' '}
          </span>
        </h1>
      </div>

      {/* Main content grid */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 xl:gap-8'>
        <VenueDetailsCard
          venue={venue}
          onEdit={() => setIsEditModalOpen(true)}
          // Pass initial venue loading state
          isLoading={isLoading}
          error={displayError}
        />

        <EventManagementSection
          venueId={venueId}
          venue={venue}
          events={events}
          eventsLoading={eventsLoading}
          filterStatus={filterStatus}
          onFilterChange={setFilterStatus}
          onAddEvent={addEvent}
          onEditEvent={openEventEditModal}
          onDeleteEvent={confirmAndDeleteEvent}
          eventFormError={eventError}
          eventSuccess={eventSuccess}
          setEventFormError={clearEventMessages}
          setEventSuccess={clearEventMessages}
        />
      </div>

      {/* Modals */}
      <EditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={async (updatedData) => {
          const success = await updateVenue(updatedData)
          setIsEditModalOpen(false)
          if (!success) {
            console.error(
              'Error al subir los datos actualizados. Verificar con Firebase',
            )
            // Refresh handled internally by useVenueData via refreshVenue
            // if useVenueActions triggers it correctly.
          }
        }}
        fields={venueFormFields}
        title='Editar Local'
        data={venue}
        isLoading={venueUpdateLoading}
        error={venueUpdateError}
      />

      <EditModal
        isOpen={isEventEditModalOpen}
        onClose={() => {
          setIsEventEditModalOpen(false)
          setCurrentEvent(null)
        }}
        onSave={async (updatedData) => {
          if (!currentEvent || !currentEvent.id) return
          setIsEventEditModalOpen(false)
          const success = await updateEvent(
            currentEvent.id,
            updatedData,
            currentEvent,
          )
          if (success) {
            setCurrentEvent(null)
          }
        }}
        fields={eventFormFields}
        title='Editar Evento'
        data={currentEvent}
        isLoading={eventsLoading}
        error={eventError}
      />
    </>
  )
}

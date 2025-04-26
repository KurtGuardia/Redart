'use client'

import { useState } from 'react'
// Re-add useVenueData import
import { useVenueData } from '../../hooks/useVenueData'
import { useVenueEvents } from '../../hooks/useVenueEvents'
import { useVenueActions } from '../../hooks/useVenueActions'
import EditModal from '../../components/EditModal'
import {
  venueFormFields,
  eventFormFields,
} from '../../lib/constants'
import EventDetailModal from '../../components/event/EventDetailModal'
import DashboardSkeleton from '../../components/DashboardSkeleton'
import VenueDetailsCard from './VenueDetailsCard'
import EventManagementSection from './EventManagementSection'

// Change prop back to venueId
export default function VenueDashboard({ venueId }) {
  // Re-introduce internal data fetching state using useVenueData
  const {
    venue,
    loading: venueLoading,
    error: venueError,
    refreshVenue, // Get refresh function if needed by useVenueActions
  } = useVenueData(venueId) // Use the hook internally

  // Local UI state remains
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

  // Pass necessary props to hooks. Ensure useVenueActions gets refreshVenue if it needs it.
  const {
    updateVenue,
    loading: venueUpdateLoading,
    error: venueUpdateError,
  } = useVenueActions(venueId, venue, refreshVenue) // Pass refreshVenue again

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

  // --- Event modal and delete logic remains the same ---
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

  const openDetailModal = (event) => {
    setSelectedEventDetail(event)
    setIsDetailModalOpen(true)
  }

  const closeDetailModal = () => {
    setSelectedEventDetail(null)
    setIsDetailModalOpen(false)
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

  // Loading state now includes initial venue loading from useVenueData
  const isLoading =
    venueLoading || eventsLoading || venueUpdateLoading
  // Combine errors from all relevant hooks
  const displayError =
    venueError || eventError || venueUpdateError

  if (displayError && !isLoading && !venue) {
    // Handle case where initial load failed but maybe subsequent actions have errors
    return <div>Error: {displayError}</div>
  }
  if (!venue && !isLoading && !displayError) {
    // Should ideally not be reached if loading/error handled above
    console.warn(
      'VenueDashboard reached unexpected state: no venue, no loading, no error.',
    )
    return <DashboardSkeleton />
  }

  // Show specific errors from event/update actions if they occur, even if venue loaded
  if ((eventError || venueUpdateError) && venue) {
    console.error(
      'Error in VenueDashboard (events or update):',
      eventError || venueUpdateError,
    )
    // Display these errors via toast or inline messages within the rendered dashboard below.
  }

  // Render the main dashboard structure
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
          isLoading={venueLoading || venueUpdateLoading}
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
          onViewDetails={openDetailModal}
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
          if (success) {
            setIsEditModalOpen(false)
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
          const success = await updateEvent(
            currentEvent.id,
            updatedData,
            currentEvent,
          )
          if (success) {
            setIsEventEditModalOpen(false)
            setCurrentEvent(null)
          }
        }}
        fields={eventFormFields}
        title='Editar Evento'
        data={currentEvent}
        isLoading={eventsLoading}
        error={eventError}
      />

      <EventDetailModal
        isOpen={isDetailModalOpen}
        onClose={closeDetailModal}
        event={selectedEventDetail}
      />
    </>
  )
}

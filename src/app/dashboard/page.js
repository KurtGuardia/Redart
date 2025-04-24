'use client'

import { useState, useEffect } from 'react'
import { auth } from '../../lib/firebase-client'
import { signOutAndRedirect } from '../../lib/utils'
import { useRouter } from 'next/navigation'
import { useVenueData } from '../../hooks/useVenueData'
import { useVenueEvents } from '../../hooks/useVenueEvents'
import { useVenueActions } from '../../hooks/useVenueActions'
import Spot from '../../components/ui/Spot'
import EditModal from '../../components/EditModal'
import {
  venueFormFields,
  eventFormFields,
} from '../../lib/constants'
import EventDetailModal from '../../components/event/EventDetailModal'
import DashboardSkeleton from '../../components/DashboardSkeleton'
import VenueDetailsCard from '../../components/dashboard/VenueDetailsCard'
import EventManagementSection from '../../components/dashboard/EventManagementSection'

export default function Dashboard() {
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

  const router = useRouter()

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(
      (currentVenue) => {
        if (currentVenue) {
          setVenueId(currentVenue.uid)
        } else {
          router.push('/login')
        }
      },
    )

    return () => unsubscribe()
  }, [router])

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

  const isLoading =
    venueLoading || eventsLoading || venueUpdateLoading
  const displayError =
    venueError || eventError || venueUpdateError

  if (isLoading && !venue) return <DashboardSkeleton />
  if (displayError && !isLoading)
    return <div>Error: {displayError}</div>
  if (!venue && !isLoading && !displayError)
    return <DashboardSkeleton />

  return (
    <>
      <div className='relative mx-auto px-8 my-24 2xl:max-w-[80%] 2xl:min-w-[80%]'>
        <Spot colorName={'red'} />
        <Spot colorName={'indigo'} />
        <Spot colorName={'peru'} />
        <div className='bg-gradient-to-r from-teal-500 to-blue-500 rounded-lg shadow-lg p-6 mb-8'>
          <h1 className='text-3xl 2xl:text-6xl font-bold text-white'>
            Bienvenid@, personal de:{' '}
            <span className='font-bold text-4xl 2xl:text-7xl drop-shadow-lg'>
              {' '}
              {venue.name || 'Cargando nombre...'}{' '}
            </span>
          </h1>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 xl:gap-8'>
          <VenueDetailsCard
            venue={venue}
            onEdit={() => setIsEditModalOpen(true)}
            isLoading={venueLoading}
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
      </div>

      <EditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={async (updatedData) => {
          const success = await updateVenue(updatedData)
          if (success) {
            setIsEditModalOpen(false)
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

      <div className='w-fit mx-auto p-4'>
        <button
          onClick={() => signOutAndRedirect(auth, router)}
          className='w-full py-2 px-4 bg-red-500 text-white font-semibold md:text-lg 2xl:text-2xl rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2'
        >
          Cerrar sesión
        </button>
      </div>
    </>
  )
}

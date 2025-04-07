'use client'

import { useState } from 'react'
import VenueEventListItem from '../../../components/VenueEventListItem'
import EventDetailModal from '../../../components/EventDetailModal'
import { useEventsByVenue } from '../../../hooks/useEventsByVenue'
import { useIsIndexPage } from '../../../hooks/useIsIndexPage'

const VenueEventListWrapper = ({ venueId }) => {
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const isIndexPage = useIsIndexPage()

  const { events, loading, error } =
    useEventsByVenue(venueId)

  const openModal = (event) => {
    setSelectedEvent(event)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setSelectedEvent(null)
    setIsModalOpen(false)
  }

  if (loading) {
    return (
      <div className='text-center py-4 text-gray-500'>
        Cargando eventos...
      </div>
    )
  }

  if (error) {
    return (
      <div className='text-center py-4 text-red-500'>
        Error al cargar eventos: {error}
      </div>
    )
  }

  if (!events || events.length === 0) {
    return (
      <div className='text-center py-4 text-gray-500'>
        No hay eventos programados en este lugar por el
        momento.
      </div>
    )
  }

  return (
    <>
      <ul className='space-y-4'>
        {events.map((event) => (
          <VenueEventListItem
            key={event.id}
            event={event}
            onClickItem={openModal}
            isIndexPage={isIndexPage}
          />
        ))}
      </ul>
      <EventDetailModal
        isOpen={isModalOpen}
        onClose={closeModal}
        event={selectedEvent}
      />
    </>
  )
}

export default VenueEventListWrapper

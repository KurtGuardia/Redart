'use client'

import { useState } from 'react'
import VenueEventListItem from '../event/VenueEventListItem' // Updated import path
import EventDetailModal from '../event/EventDetailModal' // Updated import path
import { useEventsByVenue } from '../../hooks/useEventsByVenue' // Updated import path
import { useIsIndexPage } from '../../hooks/useIsIndexPage' // Updated import path
import { Skeleton } from '../ui/Skeleton' // Updated import path
import MapComponent from '../map/MapComponent' // Updated import path

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

  if (error) {
    throw error
  }

  if (loading) {
    return (
      <div className='space-y-4 min-h-[100px] sm:min-h-[300px]'>
        {[...Array(3)].map((_, index) => (
          <Skeleton
            key={index}
            className='h-15 bg-gray-300 w-full rounded-lg h-[100px]'
          />
        ))}
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

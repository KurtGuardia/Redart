'use client'

import { useState } from 'react'
import VenueEventListItem from '../../../components/VenueEventListItem'
import EventDetailModal from '../../../components/EventDetailModal'

const VenueEventListWrapper = ({ initialEvents = [] }) => {
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const openModal = (event) => {
    setSelectedEvent(event)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setSelectedEvent(null)
    setIsModalOpen(false)
  }

  if (!initialEvents || initialEvents.length === 0) {
    return (
      <p className='text-gray-500 text-center py-6'>
        No hay próximos eventos programados en este lugar.
      </p>
    )
  }

  return (
    <>
      <ul className='space-y-4'>
        {initialEvents.map((event) => (
          <VenueEventListItem
            key={event.id}
            event={event}
            // Note: onEdit/onDelete are not relevant on public page
            // onEdit={() => {}}
            // onDelete={() => {}}
            onClickItem={openModal} // Pass the modal open handler
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

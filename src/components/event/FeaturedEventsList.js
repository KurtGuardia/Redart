'use client'

import React, { useState } from 'react'
import { useFeaturedEvents } from '../../hooks/useFeaturedEvents'
import EventCard from './EventCard'
import Spot from '../ui/Spot'
import Link from 'next/link'
import EventDetailModal from './EventDetailModal'
import EventCardSkeleton from './EventCardSkeleton'

export default function FeaturedEventsList() {
  const { events, loading } = useFeaturedEvents()
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

  return (
    <>
      <section className='featured-events py-16 mt-24'>
        <div className='relative mx-auto px-4'>
          <Spot colorName={'FireBrick'} />
          <Spot colorName={'Magenta'} />
          <Spot colorName={'Peru'} />
          <h2 className='text-3xl xl:text-5xl font-bold text-center mb-10 xl:mb-16   bg-gradient-to-r from-[var(--blue-600)] to-[var(--blue-900)] bg-clip-text text-transparent px-6 py-3 rounded-lg'>
            Eventos destacados
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-14 xl:mb-24 w-full min-w-[80vw] justify-items-center'>
            {loading &&
              Array.from({ length: 3 }).map((_, index) => (
                <EventCardSkeleton
                  key={`initial-skeleton-${index}`}
                />
              ))}

            {events.map((event) => (
              <EventCard
                key={event.id}
                title={event.name || event.title}
                description={event.description}
                date={event.date}
                address={event.address}
                venueId={event.venueId}
                venueName={event.venueName}
                image={event.image || '/placeholder.svg'}
                status={event.status}
                onClick={() => openModal(event)}
              />
            ))}
          </div>

          <div className='text-center'>
            <Link
              href='/events'
              className='bg-[var(--secondary-color)] text-[var(--secondary-color-foreground)] px-6 py-2 rounded-full  hover:bg-teal-700 hover:text-[var(--white)] transition duration-300 text-sm xl:text-xl font-semibold shadow-md mx-auto'
            >
              Ver todos los eventos
            </Link>
          </div>
        </div>
      </section>

      <EventDetailModal
        isOpen={isModalOpen}
        onClose={closeModal}
        event={selectedEvent}
      />
    </>
  )
}

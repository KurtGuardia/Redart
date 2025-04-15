'use client'

import React, { useState } from 'react'
import { useFeaturedEvents } from '../../hooks/useFeaturedEvents'
import EventCard from './EventCard'
import Spot from '../ui/Spot'
import Link from 'next/link'
import EventDetailModal from './EventDetailModal'

export default function FeaturedEventsList () {
  const { events, loading, error } = useFeaturedEvents()
  const [selectedEvent, setSelectedEvent] = useState( null )
  const [isModalOpen, setIsModalOpen] = useState( false )

  const openModal = ( event ) => {
    setSelectedEvent( event )
    setIsModalOpen( true )
  }

  const closeModal = () => {
    setSelectedEvent( null )
    setIsModalOpen( false )
  }

  // --- Loading State ---
  if ( loading ) {
    // Optional: Add a more sophisticated loading skeleton
    return (
      <section className='featured-events py-16 my-24'>
        <div className='relative mx-auto px-4'>
          <h2 className='text-3xl font-bold text-center mb-8 bg-gradient-to-r from-[var(--blue-600)] to-[var(--blue-900)] bg-clip-text text-transparent px-6 py-3 rounded-lg'>
            Eventos destacados
          </h2>
          <p className='text-center'>Cargando eventos...</p>
          {/* You could render placeholder cards here */}
        </div>
      </section>
    )
  }

  // --- Error State ---
  if ( error ) {
    return (
      <section className='featured-events py-16 my-24'>
        <div className='relative mx-auto px-4'>
          <h2 className='text-3xl font-bold text-center mb-8 bg-gradient-to-r from-[var(--blue-600)] to-[var(--blue-900)] bg-clip-text text-transparent px-6 py-3 rounded-lg'>
            Eventos destacados
          </h2>
          <p className='text-center text-red-500'>
            Error al cargar eventos: {error}
          </p>
        </div>
      </section>
    )
  }

  // --- No Events State ---
  if ( !events || events.length === 0 ) {
    return (
      <section className='featured-events py-16 my-24'>
        <div className='relative mx-auto px-4'>
          <h2 className='text-3xl font-bold text-center mb-8 bg-gradient-to-r from-[var(--blue-600)] to-[var(--blue-900)] bg-clip-text text-transparent px-6 py-3 rounded-lg'>
            Eventos destacados
          </h2>
          <p className='text-center'>
            No hay eventos destacados en este momento.
          </p>
          {/* Optional: Keep the "Ver todos" button even if no featured events */}
          <div className='text-center mt-8'>
            <Link
              href='/events'
              className='bg-[var(--secondary-color)] text-[var(--secondary-color-foreground)] px-6 py-2 rounded-full text-lg font-semibold hover:bg-teal-700 hover:text-[var(--white)] transition duration-300'
            >
              Ver todos los eventos
            </Link>
          </div>
        </div>
      </section>
    )
  }

  // --- Success State: Render Events ---
  return (
    <>
      <section className='featured-events py-16 my-24'>
        <div className='relative mx-auto px-4'>
          {/* Keep Spots if they belong logically to this section */}
          <Spot colorName={'FireBrick'} />
          <Spot colorName={'Magenta'} />
          <Spot colorName={'Peru'} />
          <h2 className='text-3xl font-bold text-center mb-8 bg-gradient-to-r from-[var(--blue-600)] to-[var(--blue-900)] bg-clip-text text-transparent px-6 py-3 rounded-lg'>
            Eventos destacados
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-14 justify-items-center'>
            {events.map( ( event ) => (
              <EventCard
                key={event.id}
                title={event.name || event.title}
                description={event.description}
                date={event.date}
                location={
                  event.venue?.city ||
                  event.city ||
                  'Ciudad no especificada'
                }
                image={event.imageUrl || event.image}
                status={event.status}
                onClick={() => openModal( event )}
              />
            ) )}
          </div>
          <div className='text-center'>
            <Link
              href='/events'
              className='bg-[var(--secondary-color)] text-[var(--secondary-color-foreground)] px-6 py-2 rounded-full text-lg font-semibold hover:bg-teal-700 hover:text-[var(--white)] transition duration-300'
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

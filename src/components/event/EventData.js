'use client'

import { useEffect } from 'react'
import { useEventData } from '../../hooks/useEventData'
import { formatTimestamp } from '../../lib/utils'

export default function EventData({ eventId }) {
  const { event, loading, error } = useEventData(eventId)

  useEffect(() => {
    if (event) {
      document.title = `${
        event.title || 'Evento'
      } | Radarte`
      const metaDesc = document.querySelector(
        'meta[name="description"]',
      )
      if (metaDesc)
        metaDesc.setAttribute(
          'content',
          event.description?.substring(0, 160) ||
            'Detalles del evento.',
        )
    }
  }, [event])

  if (loading) {
    return (
      <div className='text-center py-10'>
        <p>Cargando detalles del evento...</p>
        {/* <Skeleton /> */}
      </div>
    )
  }

  if (error) {
    return (
      <div className='text-center py-10 text-red-500'>
        <p>
          Error:{' '}
          {error.message ||
            'Ocurrió un error al cargar el evento.'}
        </p>
      </div>
    )
  }

  if (!event) {
    return (
      <div className='text-center py-10 text-gray-500'>
        <p>Evento no encontrado.</p>
      </div>
    )
  }

  return (
    <>
      <h1 className='text-3xl font-bold mb-4'>
        {event.title || 'Evento sin título'}
      </h1>
      <p>Date: {formatTimestamp(event.date)}</p>
      <p>
        Venue: {event.venueName || 'Lugar no especificado'}
      </p>
      <p>
        Description:{' '}
        {event.description || 'Sin descripción.'}
      </p>
      {event.image && (
        <img
          src={event.image}
          alt={event.title || 'Event image'}
          className='my-4 max-w-full h-auto rounded'
        />
      )}
      {/* ... other details ... */}
    </>
  )
}

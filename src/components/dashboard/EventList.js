'use client'

import React, { useMemo } from 'react'
import VenueEventListItem from '../event/VenueEventListItem'
import { hasEventPassed } from '../../lib/utils' // Import hasEventPassed

export default function EventList ( {
  events, // Original list (useful for checking if *any* events exist)
  loading,
  filterStatus,
  onFilterChange,
  onEdit,
  onDelete,
  onViewDetails,
} ) {
  const filteredEvents = useMemo( () => {
    if ( !events ) return [] // Handle cases where events might not be loaded yet
    return events.filter( ( event ) => {
      const isPast = hasEventPassed( event.date )
      const status = event.status || 'active'

      switch ( filterStatus ) {
        case 'suspended':
          return status === 'suspended'
        case 'cancelled':
          return status === 'cancelled'
        case 'past':
          // Show only past events that aren't cancelled or suspended
          return (
            isPast &&
            status !== 'cancelled' &&
            status !== 'suspended'
          )
        case 'active':
          // Show only upcoming events that aren't cancelled or suspended
          return (
            !isPast &&
            status !== 'cancelled' &&
            status !== 'suspended'
          )
        case 'all':
        default:
          return true // Show all
      }
    } )
  }, [events, filterStatus] )

  // Determine button styles based on active filter
  const getButtonClass = ( status ) => {
    return `px-3 py-1 rounded-md text-sm ${filterStatus === status
        ? 'bg-teal-600 text-white shadow'
        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
      }`
  }

  return (
    <div className='mt-6'>
      {' '}
      {/* Add margin top */}
      <h3 className='text-lg font-semibold w-fit text-gray-800 mb-4 border-b pb-2'>
        Listado de eventos
      </h3>
      {/* Filter Buttons - Show only if not loading and there are *any* events */}
      {!loading && events && events.length > 0 && (
        <div className='flex flex-wrap gap-2 mb-4 border-b pb-4'>
          <button
            onClick={() => onFilterChange( 'all' )}
            className={getButtonClass( 'all' )}
          >
            Todos
          </button>
          <button
            onClick={() => onFilterChange( 'active' )}
            className={getButtonClass( 'active' )}
          >
            Próximos
          </button>
          <button
            onClick={() => onFilterChange( 'past' )}
            className={getButtonClass( 'past' )}
          >
            Pasados
          </button>
          <button
            onClick={() => onFilterChange( 'suspended' )}
            className={getButtonClass( 'suspended' )}
          >
            Suspendidos
          </button>
          <button
            onClick={() => onFilterChange( 'cancelled' )}
            className={getButtonClass( 'cancelled' )}
          >
            Cancelados
          </button>
        </div>
      )}
      {/* Loading State */}
      {loading && (
        <div className='text-center py-8'>
          <div className='animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500 mx-auto mb-4'></div>
          <p className='text-gray-500'>
            Cargando eventos...
          </p>
        </div>
      )}
      {/* Empty State (After Loading) - Use the calculated filteredEvents */}
      {!loading && filteredEvents.length === 0 && (
        <div className='text-center py-8 text-gray-500'>
          <svg
            className='w-16 h-16 mx-auto mb-4 text-gray-400'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
            xmlns='http://www.w3.org/2000/svg'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
            />
          </svg>
          <p>
            {
              events.length === 0
                ? 'Aún no has creado ningún evento.' // Message if no events exist at all
                : 'No hay eventos que coincidan con el filtro seleccionado.' // Message if filtering resulted in empty
            }
          </p>
          {/* Show "Show All" button only if filters are active and resulted in empty */}
          {events.length > 0 && filterStatus !== 'all' && (
            <button
              onClick={() => onFilterChange( 'all' )}
              className='mt-4 text-sm text-teal-600 hover:underline'
            >
              Mostrar todos los eventos
            </button>
          )}
        </div>
      )}
      {/* Event List Items - Use the calculated filteredEvents */}
      {!loading && filteredEvents.length > 0 && (
        <ul className='space-y-3 mb-6'>
          {filteredEvents.map( ( event ) => (
            <VenueEventListItem
              key={event.id}
              event={event}
              onEdit={() => onEdit( event )}
              onDelete={() =>
                onDelete( event.id, event.image )
              }
              isIndexPage
              onClickItem={() => onViewDetails( event )}
              detail
              view
              handler
            />
          ) )}
        </ul>
      )}
    </div>
  )
}

'use client'

import EventCreateForm from './EventCreateForm'
import EventList from './EventList'

export default function EventManagementSection({
  events,
  eventsLoading,
  filterStatus,
  onFilterChange,
  onAddEvent,
  onEditEvent,
  onDeleteEvent,
  eventFormError,
  eventSuccess,
  setEventFormError,
  setEventSuccess,
}) {
  return (
    <div className='bg-white rounded-lg shadow-lg p-6'>
      <h2 className='text-2xl md:text-3xl 2xl:text-4xl font-semibold mb-4 text-gray-800 flex items-center'>
        <svg
          className='w-6 h-6 mr-2'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
          />
        </svg>
        Mis eventos
      </h2>

      <EventCreateForm
        onAddEvent={onAddEvent}
        eventFormError={eventFormError}
        eventSuccess={eventSuccess}
        setEventFormError={setEventFormError}
        setEventSuccess={setEventSuccess}
      />

      <EventList
        events={events}
        loading={eventsLoading}
        filterStatus={filterStatus}
        onFilterChange={onFilterChange}
        onEdit={onEditEvent}
        onDelete={onDeleteEvent}
      />
    </div>
  )
}

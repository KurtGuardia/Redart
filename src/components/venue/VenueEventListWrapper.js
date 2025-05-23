'use client'

import VenueEventListItem from '../event/VenueEventListItem'
import { useEventsByVenue } from '../../hooks/useEventsByVenue'
import { Skeleton } from '../ui/Skeleton'

const VenueEventListWrapper = ({ venueId }) => {
  const { events, loading, error } =
    useEventsByVenue(venueId)

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
      <ul className='space-y-4 xl:space-y-6'>
        {events.map((event) => (
          <VenueEventListItem
            key={event.id}
            event={event}
          />
        ))}
      </ul>
    </>
  )
}

export default VenueEventListWrapper

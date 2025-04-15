import Image from 'next/image'
import {
  formatTimestamp,
  hasEventPassed,
} from '../../lib/utils'

// Helper for status badge styling
const getStatusBadgeInfo = ( status, isPast ) => {
  if ( status === 'cancelled' ) {
    return {
      label: 'CANCELADO',
      classes: 'bg-red-500',
    }
  } else if ( status === 'suspended' ) {
    return {
      label: 'SUSPENDIDO',
      classes: 'bg-yellow-500',
    }
  } else if ( isPast ) {
    // Optionally add a past badge, or handle via background only
    // return { label: 'FINALIZADO', classes: 'bg-gray-500 text-white' };
    return null
  }
  return null // No badge for active, future events
}

const EventCard = ( {
  title,
  description,
  date,
  location,
  image,
  onClick,
  status, // Accept status prop
} ) => {
  const isPast = hasEventPassed( date )
  const currentStatus = status || 'active'
  let backgroundClass = 'bg-[var(--primary-transparent)]'
  let opacityClass = 'opacity-100'
  let badgeInfo = getStatusBadgeInfo( currentStatus, isPast )

  if ( currentStatus === 'cancelled' ) {
    backgroundClass = 'bg-[var(--pink-600-transparent)]'
    opacityClass = 'opacity-60' // Add opacity to cancelled cards
  } else if ( currentStatus === 'suspended' ) {
    opacityClass = 'opacity-50'
  } else if ( isPast ) {
    backgroundClass = 'bg-gray-400/30'
  } else {
    // Default active/future styles (can adjust if needed)
    backgroundClass = 'bg-[var(--primary-transparent)]'
  }

  return (
    <div
      className='relative text-white cursor-pointer'
      onClick={onClick}
    >
      {/* Status Badge - Positioned Absolutely */}
      {badgeInfo && (
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform -rotate-12 ${badgeInfo.classes} px-16 py-1.5 text-center font-bold text-lg tracking-widest shadow-lg whitespace-nowrap z-10`}
        >
          {badgeInfo.label}
        </div>
      )}

      <div
        className={`relative text-white overflow-hidden flex flex-col group rounded-xl shadow-lg hover:shadow-2xl transition-all duration-500 p-6 max-w-sm mx-auto w-full ${backgroundClass} ${opacityClass}`}
      >
        <div className='relative overflow-hidden rounded-lg mb-4 aspect-[4/3]'>
          {image ? (
            <Image
              src={image}
              alt={title}
              fill
              className='object-cover rounded-lg scale-[1.20] group-hover:scale-100 transition-transform duration-500'
            />
          ) : (
            <div className='w-full h-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary-color)] p-4 flex items-center justify-center rounded-lg'>
              <span className='text-white font-medium text-center'>
                Imagen no disponible
              </span>
            </div>
          )}
          {image && (
            <div className='absolute inset-0 bg-gradient-to-t from-black/70 to-transparent to-30% rounded-lg' />
          )}
        </div>
        <h3
          className={`text-xl font-semibold mb-2 truncate h-[1.75rem] sm:line-clamp-2 sm:h-[3.5rem] sm:whitespace-normal`}
          title={title}
        >
          {title}
        </h3>
        {description && (
          <p
            className={`text-sm mb-4 flex-1 line-clamp-3`}
            title={description}
          >
            {description}
          </p>
        )}
        <div className='flex justify-between items-center mt-auto pt-2'>
          <div className='flex items-center gap-2 text-gray-600'>
            {date && (
              <span className='bg-gray-100 px-2 py-1 rounded-md text-[11px] whitespace-nowrap'>
                📅{' '}
                {formatTimestamp( date, {
                  dateStyle: 'medium',
                  timeStyle: undefined,
                } )}
              </span>
            )}
            {location && (
              <span className='bg-gray-100 px-2 py-1 rounded-md text-[11px] whitespace-nowrap'>
                📍 {location}
              </span>
            )}
          </div>
          <span className='text-[var(--primary)] font-semibold hover:text-[var(--gray-900)] transition-colors text-[12px]'>
            Ver más
          </span>
        </div>
      </div>
    </div>
  )
}

export default EventCard

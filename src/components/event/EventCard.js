import Image from 'next/image'
import {
  formatTimestamp,
  hasEventPassed,
  addToGoogleCalendar,
} from '../../lib/utils'
import Link from 'next/link'
import { useIsIndexPage } from '../../hooks/useIsIndexPage'

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


    return null
  }
  return null
}

const EventCard = ( {
  title,
  description,
  date,
  venueName,
  venueId,
  address = 'Cochabamba',
  image,
  onClick,
  duration,
  status,
} ) => {
  const isPast = hasEventPassed( date )
  const currentStatus = status || 'active'
  let backgroundClass = 'bg-[var(--primary-transparent)]'
  let opacityClass = 'opacity-100'
  let isIndex = useIsIndexPage()
  let badgeInfo = getStatusBadgeInfo( currentStatus, isPast )


  if ( currentStatus === 'cancelled' ) {
    backgroundClass = 'bg-[var(--pink-600-transparent)]'
    opacityClass = 'opacity-60'
  } else if ( currentStatus === 'suspended' ) {
    opacityClass = 'opacity-50'
  } else if ( isPast ) {
    backgroundClass = 'bg-gray-400/30'
  } else {

    backgroundClass = 'bg-[var(--primary-transparent)]'
  }

  return (
    <div
      className={`relative text-white cursor-pointer ${isIndex ? "mx-auto min-w-[90%] max-w-[90%] xl:min-w-[70%] xl:max-w-[70%] lg:max-w-[80%] lg:min-w-[80%]" : ""}`}
      onClick={onClick}
    >
      {badgeInfo && (
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform -rotate-12 ${badgeInfo.classes} px-16 py-1.5 text-center font-bold text-lg tracking-widest shadow-lg whitespace-nowrap z-10`}
        >
          {badgeInfo.label}
        </div>
      )}

      <div
        className={`relative text-white overflow-hidden flex flex-col group rounded-xl shadow-lg hover:shadow-2xl transition-all duration-500 p-2 mx-auto w-full ${backgroundClass} ${opacityClass}`}
      >
        <div className='relative overflow-hidden rounded-lg mb-4 aspect-[4/3]'>
          {image !== '/placeholder.svg' ? (
            <>
              <Image
                src={image}
                alt={title}
                fill
                className='object-cover rounded-lg scale-[1.05] group-hover:scale-100 transition-transform duration-500'
              />
              <div className='absolute inset-0 bg-gradient-to-t from-black/80 to-transparent to-30% rounded-lg' />
            </>
          ) : (
            <>
              <Image
                src={image}
                alt={title}
                fill
                className='object-cover rounded-lg scale-[1.20] group-hover:scale-100 transition-transform duration-500'
              />
              <div className='absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-lg' />
            </>
          )}
        </div>

        <h3
          className={`text-lg xl:text-2xl font-semibold mb-1 truncate`}
          title={title}
        >
          {title}
        </h3>

        <div className="flex flex-wrap gap-2 items-center mb-2">
          {date && (
            <a
              href={addToGoogleCalendar( { title, date, description, address, duration } )}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs xl:text-lg text-[var(--teal-300)] bg-black/10 hover:bg-black/20 px-2 py-0.5 rounded font-medium  hover:text-accent transition-colors truncate"
              title="Añadir a Google Calendar"
              onClick={e => e.stopPropagation()}
            >
              <span role="img" aria-label="calendar">📅</span>
              {formatTimestamp( date, { dateStyle: 'medium', timeStyle: undefined } )}
            </a>
          )}
          {venueName ? (
            <Link href={`/venues/${venueId}`}>
              <span
                className="flex items-center gap-1 text-xs xl:text-lg text-[var(--teal-300)] hover:text-accent bg-black/10 hover:bg-black/20 px-2 py-0.5 rounded font-medium"
                onClick={e => e.stopPropagation()}
              >
                <span role="img" aria-label="venueName">📍</span> {venueName}
              </span>
            </Link>
          ) : null}
        </div>

        {description && (
          <p
            className={`text-sm xl:text-xl mb-0 px-2 xl:mb-4 flex-1 line-clamp-3`}
            title={description}
          >
            {description}
          </p>
        )}

        <div className='flex justify-end items-center mt-auto pt-0'>
          <span className='text-[var(--accent)] font-semibold hover:text-[var(--teal-500)] transition-colors text-xs 2xl:text-lg cursor-pointer'>
            Ver más
          </span>
        </div>
      </div>
    </div>
  )
}

export default EventCard

'use client'

import Image from 'next/image'
import Link from 'next/link'
import {
  formatTimestamp,
  getCategoryLabel,
  getCurrencySymbol,
  hasEventPassed,
} from '../lib/utils'

// Function to get category color classes
const getCategoryColor = (category) => {
  switch (category) {
    case 'music':
      return 'bg-blue-100 text-blue-800'
    case 'art':
      return 'bg-purple-100 text-purple-800'
    case 'theater':
      return 'bg-yellow-100 text-yellow-800'
    case 'dance':
      return 'bg-pink-100 text-pink-800'
    case 'comedy':
      return 'bg-green-100 text-green-800'
    case 'workshop':
      return 'bg-orange-100 text-orange-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

// Function to get status badge styles
const getStatusBadgeStyle = (status, isPast) => {
  if (status === 'cancelled') {
    return 'bg-[var(--pink-600-transparent)]'
  }
  if (status === 'postponed') {
    return 'bg-yellow-100 text-yellow-800'
  }
  if (isPast) {
    return 'bg-gray-200 text-gray-600'
  }
  return '' // No badge for active, future events
}

const getStatusLabel = (status, isPast) => {
  if (status === 'cancelled') return 'Cancelado'
  if (status === 'postponed') return 'Pospuesto'
  if (isPast) return 'Finalizado'
  return ''
}

const VenueEventListItem = ({
  event,
  onEdit,
  onDelete,
  onOpenModal,
  onClickItem,
}) => {
  if (!event) return null

  const isPast = hasEventPassed(event.date)
  const status = event.status || 'active' // Default to active if status is missing

  const imageUrl = event.featuredImage || '/placeholder.svg'
  const eventDateTime = formatTimestamp(event.date, {
    dateStyle: 'long',
    timeStyle: undefined,
  })
  const categoryLabel = getCategoryLabel(event.category)
  const categoryColor = getCategoryColor(event.category)
  const currencySymbol = getCurrencySymbol(event.currency)
  const priceDisplay =
    event.price > 0
      ? `${currencySymbol} ${event.price}`
      : 'Gratis'

  // Determine background and opacity based on status and date
  let backgroundClass = ''
  let opacityClass = ''

  if (status === 'cancelled') {
    backgroundClass = 'bg-[var(--pink-600-transparent)]'
  } else if (status === 'postponed') {
    backgroundClass =
      'bg-[var(--secondary-color-transparent)]' // Keep active bg
    opacityClass = 'opacity-50'
  } else {
    // Active or Completed (potentially)
    backgroundClass = isPast
      ? 'bg-gray-100'
      : 'bg-[var(--secondary-color-transparent)]'
  }

  const badgeStyle = getStatusBadgeStyle(status, isPast)
  const badgeLabel = getStatusLabel(status, isPast)

  const handleButtonClick = (e) => {
    e.stopPropagation()
  }

  return (
    <li
      className={`p-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer ${backgroundClass} ${opacityClass}`}
      onClick={() => onClickItem && onClickItem(event)}
    >
      <div className='flex items-start gap-4'>
        {/* Left: Image */}
        <div className='flex-shrink-0 w-20 h-20 relative rounded-md overflow-hidden'>
          <Image
            src={imageUrl}
            alt={`Imagen de ${event.title}`}
            fill
            className='object-cover'
            sizes='(max-width: 640px) 10vw, 80px'
            unoptimized={
              imageUrl.startsWith('http') ? undefined : true
            }
          />
        </div>

        {/* Right Side Container (Info + Badge + Actions) */}
        <div className='flex-1 flex flex-col min-w-0'>
          <div className='flex justify-between items-start gap-2'>
            {/* Middle: Info */}
            <div className='flex-1 min-w-0'>
              <div className='flex items-center gap-2 mb-1 flex-wrap'>
                <h3 className='font-semibold truncate'>
                  {event.title || 'Evento sin título'}
                </h3>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${categoryColor}`}
                >
                  {categoryLabel}
                </span>
              </div>
              <p className='text-sm mt-1 truncate'>
                {eventDateTime}
              </p>
              <div className='flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs'>
                <span className='flex items-center'>
                  <svg
                    className='w-4 h-4 mr-1'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                    />
                  </svg>
                  {priceDisplay}
                </span>
                {event.ticketUrl && (
                  <Link
                    href={event.ticketUrl}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='flex items-center text-teal-600 hover:text-teal-800'
                    onClick={handleButtonClick}
                  >
                    <svg
                      className='w-4 h-4 mr-1'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z'
                      />
                    </svg>
                    Boletos
                  </Link>
                )}
              </div>
            </div>

            {/* Right: Actions */}
            <div className='flex flex-col sm:flex-row gap-2 flex-shrink-0'>
              <button
                onClick={(e) => {
                  handleButtonClick(e)
                  onEdit(event)
                }}
                className='text-teal-600 hover:text-teal-800 p-1'
                aria-label='Editar evento'
              >
                <svg
                  className='w-5 h-5'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z'
                  />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  handleButtonClick(e)
                  onDelete()
                }}
                className='text-red-600 hover:text-red-800 p-1'
                aria-label='Eliminar evento'
              >
                <svg
                  className='w-5 h-5'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Status Badge Section */}
          {badgeLabel && (
            <div className='mt-2 pt-2 border-t border-gray-400/30 text-right'>
              <span
                className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${badgeStyle}`}
              >
                {badgeLabel}
              </span>
            </div>
          )}
        </div>
      </div>
    </li>
  )
}

export default VenueEventListItem

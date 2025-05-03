'use client'

import Image from 'next/image'
import Link from 'next/link'
import {
  formatTimestamp,
  getCategoryLabel,
  getCurrencySymbol,
  hasEventPassed,
} from '../../lib/utils'

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

export default function VenueEventListItem({
  event,
  onEdit,
  onDelete, // Keep onDelete prop for the button
  onClickItem,
  isDashboardPage = false,
}) {
  if (!event) return null

  const isPast = hasEventPassed(event.date)
  const status = event.status || 'active'

  const imageUrl = event.image || '/placeholder.svg'
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

  let backgroundClass = ''
  let opacityClass = ''
  let textColorClass = ''

  if (status === 'cancelled') {
    backgroundClass = 'bg-[var(--pink-600-transparent)]'
  } else if (status === 'suspended') {
    backgroundClass =
      'bg-[var(--secondary-color-transparent)]'
    opacityClass = 'opacity-50'
    textColorClass = 'text-yellow-900'
  } else {
    backgroundClass = isPast
      ? 'bg-gray-100 border border-gray-200'
      : 'bg-[var(--secondary-color-transparent)]'
  }

  const handleEditClick = (e) => {
    e.stopPropagation()
    e.preventDefault()
    onEdit(event)
  }

  const handleDeleteClick = (e) => {
    e.stopPropagation()
    e.preventDefault()
    onDelete()
  }

  return (
    <li onClick={() => onClickItem && onClickItem(event)}>
      {/* Left: Image */}
      {/* Wrap content in Link, remove onClick from li */}
      <Link
        href={`/events/${event.id}`}
        className={`flex items-start gap-4 p-2 2xl:p-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 w-full ${backgroundClass} ${opacityClass} ${textColorClass}`}
      >
        {/* Left: Image */}
        <div className='flex-shrink-0 w-20 h-20 2xl:w-32 2xl:h-32 relative rounded-md overflow-hidden'>
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
        <div className='w-full flex justify-between items-start gap-2'>
          {/* Middle: Info */}
          <div className='flex-1 min-w-0'>
            <div className='flex items-center gap-2 mb-1 flex-wrap'>
              <h3 className='text-lg 2xl:text-2xl font-semibold truncate'>
                {event.title || 'Evento sin título'}
              </h3>
              <span
                className={`text-xs 2xl:text-sm px-2 py-0.5 rounded-full tracking-wider ${categoryColor}`}
              >
                {categoryLabel}
              </span>
            </div>

            <p className='text-sm 2xl:text-lg mt-1 truncate'>
              {eventDateTime}
            </p>

            <div className='flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs 2xl:text-base'>
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
            </div>
          </div>

          {/* Right: Actions */}
          {isDashboardPage && (
            <div className='flex flex-col sm:flex-row gap-2 flex-shrink-0'>
              <button
                onClick={handleEditClick}
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
                onClick={handleDeleteClick} // Use the refactored handler directly
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
          )}
        </div>
      </Link>
    </li>
  )
}

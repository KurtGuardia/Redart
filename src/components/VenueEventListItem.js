'use client'

import Image from 'next/image'

// Re-import or define LocationPinIcon if needed within this component scope
const LocationPinIcon = () => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    className='h-4 w-4 inline-block mr-1 text-[var(--teal-700)]'
    viewBox='0 0 20 20'
    fill='currentColor'
  >
    <path
      fillRule='evenodd'
      d='M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z'
      clipRule='evenodd'
    />
  </svg>
)

// Helper function to format date
const formatDate = (timestamp) => {
  if (!timestamp || !timestamp.seconds) {
    return 'Fecha no disponible'
  }
  return new Date(
    timestamp.seconds * 1000,
  ).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const VenueEventListItem = ({ event, onOpenModal }) => {
  if (!event) return null

  const imageUrl = event.featuredImage || '/placeholder.svg'
  const eventDate = formatDate(event.date)

  return (
    <div
      className='flex items-center gap-4 p-4 bg-white/80 backdrop-blur-sm rounded-lg shadow-md hover:shadow-lg hover:bg-white/90 transition-all duration-200 cursor-pointer'
      onClick={() => onOpenModal(event)} // onClick moved to parent div
    >
      {/* Left: Image */}
      <div className='flex-shrink-0 w-16 h-16 relative rounded-md overflow-hidden'>
        <Image
          src={imageUrl}
          alt={`Imagen de ${event.title}`}
          layout='fill'
          objectFit='cover'
          unoptimized={
            imageUrl.startsWith('http') ? undefined : true
          } // Consider adding unoptimized for external/non-standard URLs if needed
        />
      </div>

      {/* Middle: Title */}
      <div className='flex-grow'>
        {/* Removed onClick from h3 */}
        <h3 className='font-semibold text-lg text-[var(--teal-800)]'>
          {event.title || 'Evento sin título'}
        </h3>
      </div>

      {/* Right: Date & Button */}
      <div className='flex-shrink-0 flex flex-col items-end text-right space-y-1'>
        <span className='text-sm font-medium text-gray-600 flex items-center'>
          <span className='mr-1'>📅</span>{' '}
          {/* Replaced icon with emoji */}
          {eventDate}
        </span>
        {/* Removed onClick from button */}
        <button
          tabIndex={-1} // Prevent tabbing to button since parent div is clickable
          className='px-3 py-1 bg-[var(--teal-500)] text-white text-xs font-semibold rounded-md hover:bg-[var(--teal-700)] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--teal-500)] focus:ring-offset-1'
        >
          Ver más
        </button>
      </div>
    </div>
  )
}

export default VenueEventListItem

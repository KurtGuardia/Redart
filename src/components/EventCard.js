import Image from 'next/image'
import React from 'react'
import { formatTimestamp } from '../lib/utils'

const EventCard = ({
  title,
  description,
  date,
  location,
  image,
  onClick,
  className,
}) => (
  <div
    className={`flex flex-col group bg-[var(--primary-transparent)] text-white rounded-xl shadow-lg hover:shadow-2xl hover:bg-[var(--secondary-color-transparent)] hover:scale-[1.02] hover:text-[var(--gray-600)] transition-all duration-500 p-6 max-w-sm mx-auto w-full ${
      className || ''
    }`}
    onClick={onClick}
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
        <div className='absolute inset-0 bg-gradient-to-t from-black/30 to-transparent rounded-lg' />
      )}
    </div>
    <h3 className='text-xl font-semibold mb-2'>{title}</h3>
    {description && (
      <p className='text-sm mb-4 flex-1'>{description}</p>
    )}
    <div className='flex justify-between items-center mt-auto pt-2'>
      <div className='flex items-center gap-2 text-gray-600'>
        {date && (
          <span className='bg-gray-100 px-2 py-1 rounded-md text-[11px] whitespace-nowrap'>
            📅{' '}
            {typeof date === 'string'
              ? date
              : formatTimestamp(date, {
                  dateStyle: 'medium',
                  timeStyle: undefined,
                })}
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
)

export default EventCard

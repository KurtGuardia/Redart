'use client'

import React from 'react'
import Link from 'next/link'
import { FaStar } from 'react-icons/fa'

export default function RatedList({ title, items, type }) {
  const linkPrefix =
    type === 'venue' ? '/venues' : '/events' // Use locales/eventos based on type

  return (
    <div
      className={`rounded-lg shadow-lg p-4 md:p-6 ${
        type === 'event'
          ? 'bg-[var(--primary-transparent)] text-[var(--gray-600)]'
          : 'bg-[var(--secondary-color-transparent)] text-[var(--blue-800)]'
      } min-w-[320px] flex flex-col`}
    >
      <h2 className='text-xl font-semibold mb-4  '>
        {title}
      </h2>
      {items && items.length > 0 ? (
        <ul className='space-y-3'>
          {items.map((item) => (
            <li
              key={item.targetId}
              // Added padding, subtle hover effect
              className='flex justify-between items-center bg-white/50 p-3 border border-gray-200  rounded-md shadow-sm hover:shadow-md transition-shadow duration-200'
            >
              <Link
                href={`${linkPrefix}/${item.targetId}`}
                className='hover:underline font-medium truncate mr-4'
                title={item.name} // Add title for long names
              >
                {item.name}
              </Link>
              <span className='flex items-center font-semibold text-sm text-amber-600  whitespace-nowrap'>
                {item.score}
                <FaStar className='ml-1' />{' '}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <div className='flex-grow flex items-center justify-center h-[300px]'>
          <p className='text-gray-500 italic'>
            Aún no tienes{' '}
            {type === 'venue' ? 'locales' : 'eventos'}{' '}
            favoritos.
          </p>
        </div>
      )}
    </div>
  )
}

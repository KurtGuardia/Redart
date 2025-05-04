'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { FaStar, FaTrash } from 'react-icons/fa'
import { useAuth } from '../../hooks/useAuth'
import useRatingSystem from '../../hooks/useRatingSystem'

function RatedListItemComponent({
  item,
  type,
  linkPrefix,
  onItemDeleted,
}) {
  const { user } = useAuth()
  const [isSuccess, setIsSuccess] = useState(false)
  const [localError, setLocalError] = useState(null)

  const { isDeletingRating, handleDeleteRating } =
    useRatingSystem({
      targetId: item.targetId,
      targetType: type,
      targetName: item.name,
      user,
    })

  const handleDelete = async () => {
    setLocalError(null)
    try {
      await handleDeleteRating()
      setIsSuccess(true)

      setTimeout(() => {
        if (onItemDeleted) {
          onItemDeleted(item.targetId, type)
        }
      }, 800)
    } catch (error) {
      console.error('Error deleting rating:', error)
      setLocalError(error.message || 'Error al eliminar')

      setTimeout(() => setLocalError(null), 3000)
    }
  }

  return (
    <li
      className={`relative flex justify-between items-center bg-white/50 p-3 border border-gray-200 rounded-md shadow-sm hover:shadow-md transition-all duration-200 group ${
        // Added group class for styling
        isDeletingRating ? 'opacity-70 animate-pulse' : ''
      } ${isSuccess ? 'bg-green-50 border-green-200' : ''}`}
    >
      <Link
        href={`${linkPrefix}/${item.targetId}`}
        className='hover:underline font-medium truncate mr-4 flex-grow min-w-0'
        title={item.name}
      >
        {item.name}
      </Link>

      <div className='flex items-center gap-3 flex-shrink-0'>
        {' '}
        {/* Added flex-shrink-0 */}
        {/* Rating display */}
        <span className='flex items-center font-semibold text-sm text-amber-600 whitespace-nowrap'>
          {item.score}
          <FaStar className='ml-1' />
        </span>
        {/* Delete button */}
        <button
          onClick={handleDelete}
          disabled={isDeletingRating || isSuccess}
          className={`text-gray-400 hover:text-red-500 p-1 rounded-full transition-colors duration-200 ${
            isDeletingRating
              ? 'cursor-not-allowed'
              : 'cursor-pointer'
          } ${
            isSuccess
              ? 'text-green-500 cursor-not-allowed'
              : ''
          }`}
          title='Eliminar puntuación'
          aria-label='Eliminar puntuación'
        >
          <FaTrash size={14} />
        </button>
      </div>

      {/* Improved error display position and styling */}
      {localError && (
        <div className='absolute left-1/2 transform -translate-x-1/2 -bottom-5 w-max max-w-[calc(100%-1rem)] bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded shadow-md z-10'>
          {localError}
        </div>
      )}
    </li>
  )
}

// Memoize the component to prevent unnecessary re-renders in the list
const RatedListItem = React.memo(RatedListItemComponent)

export default RatedListItem

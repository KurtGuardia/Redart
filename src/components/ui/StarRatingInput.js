'use client'

import React, { useState, useEffect } from 'react'
import { FaStar, FaTrash } from 'react-icons/fa'

export default function StarRatingInput({
  initialRating = 0,
  onRatingSubmit,
  onDeleteClick,
  showDeleteButton = false,
  disabled = false,
  size = 24,
}) {
  const [rating, setRating] = useState(initialRating)
  const [hover, setHover] = useState(null) // Tracks hover state

  // Update internal state if the initialRating prop changes (e.g., after successful submission)
  useEffect(() => {
    setRating(initialRating)
  }, [initialRating])

  const handleClick = (currentRating) => {
    if (!disabled) {
      setRating(currentRating) // Update visual state immediately
      if (onRatingSubmit) {
        onRatingSubmit(currentRating)
      }
    }
  }

  const handleDelete = (e) => {
    e.stopPropagation() // Prevent triggering rating click if icons overlap somehow
    if (!disabled && onDeleteClick) {
      onDeleteClick()
    }
  }

  return (
    <div className='flex items-center gap-1'>
      <div className='flex items-center'>
        {[...Array(5)].map((_, index) => {
          const currentRating = index + 1

          return (
            <label key={index} className='cursor-pointer'>
              <input
                type='radio'
                name='rating'
                value={currentRating}
                onClick={() => handleClick(currentRating)}
                className='hidden' // Hide the actual radio button
                disabled={disabled}
              />
              <FaStar
                size={size}
                className={`transition-colors duration-200 ${
                  disabled
                    ? 'cursor-not-allowed'
                    : 'cursor-pointer'
                }`}
                color={
                  currentRating <= (hover || rating)
                    ? '#ffc107'
                    : '#e4e5e9'
                }
                onMouseEnter={() =>
                  !disabled && setHover(currentRating)
                }
                onMouseLeave={() =>
                  !disabled && setHover(null)
                }
              />
            </label>
          )
        })}
      </div>
      {showDeleteButton && (
        <button
          type='button'
          onClick={handleDelete}
          disabled={disabled}
          className={`ml-2 text-red-500 hover:text-red-700 transition-colors duration-200 disabled:text-gray-400 disabled:cursor-not-allowed focus:outline-none`}
          aria-label='Eliminar puntuación'
          title='Eliminar mi puntuación'
        >
          <FaTrash size={size * 0.7} />
        </button>
      )}
    </div>
  )
}

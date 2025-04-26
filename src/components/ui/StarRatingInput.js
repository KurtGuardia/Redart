'use client'

import React, { useState } from 'react'
import { FaStar } from 'react-icons/fa'

// Props:
// - initialRating: The current rating (0 if none)
// - onRatingSubmit: Function to call when a rating is clicked (passes the new rating)
// - disabled: Boolean to disable interaction
// - size: Optional size for the stars (default 24)

export default function StarRatingInput({
  initialRating = 0,
  onRatingSubmit,
  disabled = false,
  size = 24,
}) {
  const [rating, setRating] = useState(initialRating)
  const [hover, setHover] = useState(null) // Tracks hover state

  // Update internal state if the initialRating prop changes (e.g., after successful submission)
  React.useEffect(() => {
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

  return (
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
  )
}

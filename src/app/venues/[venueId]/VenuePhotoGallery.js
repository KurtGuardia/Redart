'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

const VenuePhotoGallery = ({
  photos = [],
  venueName = 'Venue',
}) => {
  const [selectedImageUrl, setSelectedImageUrl] =
    useState(null)

  // Set initial selected image
  useEffect(() => {
    if (photos.length > 0 && !selectedImageUrl) {
      setSelectedImageUrl(photos[0])
    }
  }, [photos, selectedImageUrl])

  if (!photos || photos.length === 0) {
    return null // Don't render anything if no photos
  }

  return (
    <section className='mb-10 md:mb-12 border-b border-gray-200/80 pb-8'>
      <h2 className='text-2xl md:text-3xl font-bold text-[var(--teal-800)] mb-6'>
        Galería
      </h2>
      <div className='space-y-4 md:space-y-6'>
        {/* Large Featured Image Display */}
        {selectedImageUrl && (
          <div className='relative w-full aspect-[16/9] rounded-xl overflow-hidden shadow-lg mb-4'>
            <Image
              src={selectedImageUrl}
              alt={`${venueName} selected photo`}
              fill
              className='object-cover' // Use fill and object-cover
              priority={
                photos.indexOf(selectedImageUrl) === 0
              } // Prioritize first image
            />
          </div>
        )}

        {/* Grid of Thumbnails */}
        {photos.length > 1 && (
          <div className='grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 md:gap-3'>
            {photos.map((photoUrl) => (
              <button
                key={photoUrl}
                onClick={() =>
                  setSelectedImageUrl(photoUrl)
                }
                className={`relative aspect-square rounded-md overflow-hidden transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary)] ${
                  selectedImageUrl === photoUrl
                    ? 'ring-2 ring-[var(--primary)] ring-offset-2'
                    : 'hover:opacity-80'
                }`}
              >
                <Image
                  src={photoUrl}
                  alt={`${venueName} thumbnail`}
                  fill
                  className='object-cover' // Use fill and object-cover
                  sizes='(max-width: 640px) 30vw, (max-width: 1024px) 20vw, 15vw'
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default VenuePhotoGallery

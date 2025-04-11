'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useVenueData } from '../../hooks/useVenueData' // Updated import path
import { Skeleton } from '../ui/Skeleton'

const VenuePhotoGallery = ({ venueId }) => {
  const [selectedImageUrl, setSelectedImageUrl] =
    useState(null)
  const { venue, loading, error } = useVenueData(venueId)
  const venueName =
    venue?.name ||
    '[Falta nombre, contacta al administrador]'

  // This useEffect handles setting the initial image *after* data is loaded.
  useEffect(() => {
    // Only run if not loading, venue exists, photos exist, and selected image isn't set yet
    if (
      !loading &&
      venue?.photos &&
      venue.photos.length > 0 &&
      !selectedImageUrl
    ) {
      setSelectedImageUrl(venue.photos[0])
    }
    // Depend on loading, venue object (specifically photos), and selectedImageUrl
  }, [loading, venue?.photos, selectedImageUrl])

  // Handle Error State
  if (error) {
    // Optionally: render an error message or re-throw
    console.error('Error loading venue photos:', error)
    return (
      <div className='text-red-500 p-4'>
        Error al cargar la galería.
      </div>
    )
  }

  // Handle Loading State
  if (loading) {
    return (
      <section className='mb-10 md:mb-12 border-b border-gray-200/80 pb-8 animate-pulse'>
        <Skeleton className='h-8 w-1/4 bg-gray-300 mb-6' />{' '}
        {/* Title */}
        <div className='space-y-4 md:space-y-6'>
          <Skeleton className='relative w-full aspect-[16/9] rounded-xl bg-gray-300 mb-4' />{' '}
          {/* Main Image */}
          <div className='grid grid-cols-3 md:grid-cols-5 gap-2 md:gap-3'>
            {[...Array(5)].map(
              (
                _,
                index, // Placeholder for 5 thumbnails
              ) => (
                <Skeleton
                  key={index}
                  className='aspect-square rounded-md bg-gray-300'
                />
              ),
            )}
          </div>
        </div>
      </section>
    )
  }

  // Handle Empty State (No venue data or no photos)
  if (!venue?.photos || venue.photos.length === 0) {
    return null // Don't render the gallery section if no photos
  }

  // Data is loaded, no error, and photos exist
  const photos = venue.photos // Assign photos now that we know they exist

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
          <div className='grid grid-cols-3 md:grid-cols-5 gap-2 md:gap-3'>
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

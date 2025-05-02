'use client'

import { useState, useEffect, useRef } from 'react'
import { CATEGORIES } from '../../lib/constants'
import { useEvents } from '../../hooks/useEvents' // Import the hook
import EventCard from './EventCard'
import EventDetailModal from './EventDetailModal'
import EventCardSkeleton from './EventCardSkeleton'

const EventListView = () => {
  // State managed by the component
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all')
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [debouncedSearchTerm, setDebouncedSearchTerm] =
    useState(searchTerm)
  const isInitialMount = useRef(true)
  const searchInputRef = useRef(null) // Keep ref for focus management

  // Use the custom hook, passing the debounced search term and filter
  const {
    eventsList,
    loading,
    isFetchingMore,
    hasMore,
    error,
    loadMoreEvents, // Get the load more function from the hook
  } = useEvents(debouncedSearchTerm, filter)

  // Effect to debounce search term
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 1000)

    return () => {
      clearTimeout(timerId)
    }
  }, [searchTerm])

  // Effect to refocus search input after loading completes (post-initial mount)
  // Keep this effect here as it interacts with the component's ref
  useEffect(() => {
    // Check only when loading transitions from true to false
    if (!loading) {
      if (isInitialMount.current) {
        // If it was the initial mount, just mark it as finished and don't focus
        isInitialMount.current = false
      } else {
        // If it wasn't the initial mount, focus the input
        searchInputRef.current?.focus()
      }
    }
  }, [loading])

  const openModal = (event) => {
    setSelectedEvent(event)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setSelectedEvent(null)
    setIsModalOpen(false)
  }

  const handleSearchChange = (e) => {
    const newSearchTerm = e.target.value
    setSearchTerm(newSearchTerm)
  }

  const handleCategoryFilterChange = (e) => {
    const newFilter = e.target.value
    setFilter(newFilter)
  }

  const handleLoadMore = () => {
    if (!loading && !isFetchingMore && hasMore) {
      // Call the function from the hook
      loadMoreEvents()
    }
  }

  return (
    <>
      {/* Search and Filter */}
      <div className='flex flex-col md:flex-row items-center justify-center gap-4 mb-8'>
        <div className='relative w-full md:w-1/3'>
          <input
            type='text'
            placeholder='Buscar eventos, lugares, ciudades...'
            ref={searchInputRef}
            value={searchTerm}
            onChange={handleSearchChange}
            className='bg-white w-full px-4 xl:py-2 py-1 border-2 border-gray-300 rounded-lg shadow-sm  focus:border-teal-500 pr-10 focus-visible:outline-none'
            disabled={loading || isFetchingMore} // Use hook's state
          />

          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none'
              aria-label='Clear search'
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                className='h-5 w-5'
                viewBox='0 0 20 20'
                fill='currentColor'
              >
                <path
                  fillRule='evenodd'
                  d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                  clipRule='evenodd'
                />
              </svg>
            </button>
          )}
        </div>
        <div className='relative w-full md:w-auto'>
          <select
            value={filter}
            onChange={handleCategoryFilterChange}
            className='w-full md:w-48 px-4 xl:py-2 py-1 border-2 border-gray-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500 outline-none appearance-none bg-white pr-8 cursor-pointer'
            disabled={loading || isFetchingMore} // Use hook's state
          >
            <option value='all'>Categorías</option>
            {CATEGORIES.map((category) => (
              <option
                key={category.value}
                value={category.value}
              >
                {category.label}
              </option>
            ))}
          </select>
          <div className='pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700'>
            <svg
              className='fill-current h-4 w-4'
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 20 20'
            >
              <path d='M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z' />
            </svg>
          </div>
        </div>
      </div>

      {/* Display error message if fetch failed */}
      {error &&
        !loading && ( // Use hook's state
          <p className='col-span-full text-center text-red-600 py-10'>
            😞 Ocurrió un error al cargar los eventos:{' '}
            {error.message}
          </p>
        )}

      {/* Display loading skeletons while data is being
      fetched */}
      {loading && ( // Use hook's state
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8'>
          {Array.from({ length: 4 }).map((_, index) => (
            <EventCardSkeleton
              key={`initial-skeleton-${index}`}
            />
          ))}
        </div>
      )}

      {/* Display event cards when data is loaded */}
      {!loading &&
        !error && ( // Use hook's state
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-8 gap-8 px-1 xl:px-16'>
            {eventsList.map((event) => (
              <EventCard
                key={event.id}
                onClick={() => openModal(event)}
                title={event.title}
                description={event.description}
                date={event.date}
                duration={event.duration}
                venueName={event.venueName}
                venueId={event.venueId}
                address={event.address}
                image={event.image || '/placeholder.svg'}
                status={event.status}
              />
            ))}

            {/* Display loading skeletons while fetching more */}
            {isFetchingMore && // Use hook's state
              Array.from({ length: 4 }).map((_, index) => (
                <EventCardSkeleton
                  key={`loading-more-${index}`}
                />
              ))}
          </div>
        )}

      {/* Show message if no events match the filters */}
      {!loading &&
        !error &&
        eventsList.length === 0 && ( // Use hook's state
          <p className='col-span-full text-center text-gray-500 py-10'>
            No se encontraron eventos que coincidan con los
            filtros.
          </p>
        )}

      {/* Show load more button if there are more events to
      fetch */}
      {!loading &&
        !error &&
        !isFetchingMore &&
        hasMore && ( // Use hook's state
          <div className='mt-12 text-center'>
            <button
              onClick={handleLoadMore}
              className='bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-6 rounded-full transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed'
              disabled={isFetchingMore} // Use hook's state
            >
              Cargar más
            </button>
          </div>
        )}

      <EventDetailModal
        isOpen={isModalOpen}
        onClose={closeModal}
        event={selectedEvent}
      />
    </>
  )
}

export default EventListView

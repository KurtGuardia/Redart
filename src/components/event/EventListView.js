'use client'

import { useState, useEffect, useRef } from 'react'
import { db } from '../../lib/firebase-client'
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  where,
} from 'firebase/firestore'
import { CATEGORIES } from '../../lib/constants'
import EventCard from './EventCard'
import EventDetailModal from './EventDetailModal'
import EventCardSkeleton from './EventCardSkeleton'

const ITEMS_PER_PAGE = 24

const EventListView = () => {
  const [eventsList, setEventsList] = useState([])
  const [lastVisible, setLastVisible] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isFetchingMore, setIsFetchingMore] =
    useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all')
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [debouncedSearchTerm, setDebouncedSearchTerm] =
    useState(searchTerm)
  const isInitialMount = useRef(true)
  const searchInputRef = useRef(null)

  // Effect for initial data fetch on mount
  useEffect(() => {
    fetchEvents(searchTerm, filter, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Effect to debounce search term
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 1000)

    return () => {
      clearTimeout(timerId)
    }
  }, [searchTerm])

  // Effect to fetch data based on debounced search term or filter change (after initial mount)
  useEffect(() => {
    if (isInitialMount.current) {
      // Initial mount is handled by the first effect
      isInitialMount.current = false // Mark initial mount as passed *after* first effect runs
      return
    }
    fetchEvents(debouncedSearchTerm, filter, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchTerm, filter])

  // Effect to refocus search input after loading completes (post-initial mount)
  useEffect(() => {
    // Only run if loading has just finished AND it wasn't the initial mount's loading sequence
    if (!loading && !isInitialMount.current) {
      // Optional: Check if the input exists before focusing
      searchInputRef.current?.focus()
    }
    // We depend on `loading` to trigger this effect when it changes.
    // isInitialMount.current is checked inside, so it doesn't need to be a dependency.
  }, [loading])

  const openModal = (event) => {
    setSelectedEvent(event)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setSelectedEvent(null)
    setIsModalOpen(false)
  }

  const fetchEvents = async (
    currentSearchTerm = '',
    currentCategoryFilter = 'all',
    shouldReset = false,
  ) => {
    let currentLastVisible = lastVisible
    if (shouldReset) {
      setLoading(true)
    } else {
      setIsFetchingMore(true)
    }

    setError(null)

    if (shouldReset) {
      currentLastVisible = null
    }

    // Get the start of today for date filtering
    const now = new Date()
    const today = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    )
    const todayTimestamp = Timestamp.fromDate(today)

    // Base query constraints
    let eventsQuery = query(
      collection(db, 'events'),
      where('status', '==', 'active'),
      where('date', '>=', todayTimestamp), // Only fetch future or today's events
      orderBy('date', 'desc'),
    )

    // Add category filter if not 'all'
    if (currentCategoryFilter !== 'all') {
      eventsQuery = query(
        eventsQuery,
        where('category', '==', currentCategoryFilter),
      )
    }

    if (currentLastVisible && !shouldReset) {
      eventsQuery = query(
        eventsQuery,
        startAfter(currentLastVisible),
      )
    }

    // Apply limit *after* all filters and ordering
    eventsQuery = query(eventsQuery, limit(ITEMS_PER_PAGE))

    try {
      const eventsSnapshot = await getDocs(eventsQuery)
      const newEventsData = eventsSnapshot.docs.map(
        (doc) => ({
          id: doc.id,
          ...doc.data(),
        }),
      )

      const filteredEvents = newEventsData.filter(
        // Now only filter by search term client-side
        (event) => {
          const lowerSearchTerm =
            currentSearchTerm.toLowerCase()

          const matchesSearch =
            !currentSearchTerm ||
            event.title
              ?.toLowerCase()
              .includes(lowerSearchTerm) ||
            event.description
              ?.toLowerCase()
              .includes(lowerSearchTerm) ||
            event.venueName
              ?.toLowerCase()
              .includes(lowerSearchTerm) ||
            event.city
              ?.toLowerCase()
              .includes(lowerSearchTerm)

          // Date and category filtering are now handled by Firestore query
          // We still need to ensure the date field exists, though less critical now
          return (
            matchesSearch && event.date instanceof Timestamp
          )
        },
      )

      const finalEvents = filteredEvents.map((event) => ({
        ...event,
        date: event.date?.toDate
          ? event.date.toDate().toISOString()
          : null,
        createdAt: event.createdAt?.toDate
          ? event.createdAt.toDate().toISOString()
          : null,
        updatedAt: event.updatedAt?.toDate
          ? event.updatedAt.toDate().toISOString()
          : null,
      }))

      setEventsList(
        shouldReset
          ? finalEvents
          : (prevEvents) => [...prevEvents, ...finalEvents],
      )

      const lastDocSnapshot =
        eventsSnapshot.docs[eventsSnapshot.docs.length - 1]
      setLastVisible(lastDocSnapshot || null)
      setHasMore(
        eventsSnapshot.docs.length === ITEMS_PER_PAGE,
      )
    } catch (err) {
      console.error(
        'Error fetching events client-side:',
        err,
      )
      setError(
        err instanceof Error
          ? err
          : new Error('Error al cargar eventos.'),
      )
    } finally {
      if (shouldReset) {
        setLoading(false)
      } else {
        setIsFetchingMore(false)
      }
    }
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
      fetchEvents(debouncedSearchTerm, filter, false)
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
            disabled={loading || isFetchingMore}
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
            disabled={loading || isFetchingMore}
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
      {error && !loading && (
        <p className='col-span-full text-center text-red-600 py-10'>
          😞 Ocurrió un error al cargar los eventos:{' '}
          {error.message}
        </p>
      )}

      {/* Display loading skeletons while data is being
      fetched */}
      {loading && (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8'>
          {Array.from({ length: 10 }).map((_, index) => (
            <EventCardSkeleton
              key={`initial-skeleton-${index}`}
            />
          ))}
        </div>
      )}

      {/* Display event cards when data is loaded */}
      {!loading && !error && (
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
          {isFetchingMore &&
            Array.from({ length: 4 }).map((_, index) => (
              <EventCardSkeleton
                key={`loading-more-${index}`}
              />
            ))}
        </div>
      )}

      {/* Show message if no events match the filters */}
      {!loading && !error && eventsList.length === 0 && (
        <p className='col-span-full text-center text-gray-500 py-10'>
          No se encontraron eventos que coincidan con los
          filtros.
        </p>
      )}

      {/* Show load more button if there are more events to
      fetch */}
      {!loading && !error && !isFetchingMore && hasMore && (
        <div className='mt-12 text-center'>
          <button
            onClick={handleLoadMore}
            className='bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-6 rounded-full transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed'
            disabled={isFetchingMore}
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

'use client'

import { useState, useEffect } from 'react'
import { db } from '../lib/firebase-client'
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  startAfter,
  Timestamp,
} from 'firebase/firestore'
import { CATEGORIES } from '../lib/constants'
import { hasEventPassed } from '../lib/utils'
import EventCard from './EventCard'
import EventDetailModal from './EventDetailModal'
import EventCardSkeleton from './EventCardSkeleton'

// Define status filter options (duplicated here for now, could be shared)
const STATUS_FILTERS = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Próximos' },
  { value: 'past', label: 'Pasados' },
  { value: 'suspended', label: 'Suspendidos' },
  { value: 'cancelled', label: 'Cancelados' },
]

const ITEMS_PER_PAGE = 8

// Revert to original component without props
const EventListView = () => {
  // Restore original state
  const [eventsList, setEventsList] = useState([])
  const [lastVisible, setLastVisible] = useState(null)
  const [loading, setLoading] = useState(true) // Back to initial loading state
  const [isFetchingMore, setIsFetchingMore] =
    useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Restore initial fetch useEffect
  useEffect(() => {
    fetchEvents(searchTerm, filter, filterStatus, true)
  }, [])

  const openModal = (event) => {
    setSelectedEvent(event)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setSelectedEvent(null)
    setIsModalOpen(false)
  }

  // Restore fetchEvents logic with initial loading state
  const fetchEvents = async (
    currentSearchTerm = '',
    currentCategoryFilter = 'all',
    currentStatusFilter = 'all',
    shouldReset = false,
  ) => {
    if (shouldReset) {
      setLoading(true)
    } else {
      setIsFetchingMore(true)
    }
    setError(null)

    let currentLastVisible = lastVisible
    if (shouldReset) {
      currentLastVisible = null
    }

    let eventsQuery = query(
      collection(db, 'events'),
      orderBy('date', 'desc'),
      limit(ITEMS_PER_PAGE),
    )

    if (currentLastVisible && !shouldReset) {
      eventsQuery = query(
        eventsQuery,
        startAfter(currentLastVisible),
      )
    }

    try {
      const eventsSnapshot = await getDocs(eventsQuery)
      const newEventsData = eventsSnapshot.docs.map(
        (doc) => ({
          id: doc.id,
          ...doc.data(),
        }),
      )

      const filteredEvents = newEventsData.filter(
        (event) => {
          const lowerSearchTerm =
            currentSearchTerm.toLowerCase()
          const eventDateTimestamp = event.date
          const isPast = eventDateTimestamp
            ? hasEventPassed(eventDateTimestamp)
            : false
          const status = event.status || 'active'

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

          const matchesCategoryFilter =
            currentCategoryFilter === 'all' ||
            event.category === currentCategoryFilter

          let matchesStatusFilter = false
          switch (currentStatusFilter) {
            case 'suspended':
              matchesStatusFilter = status === 'suspended'
              break
            case 'cancelled':
              matchesStatusFilter = status === 'cancelled'
              break
            case 'past':
              matchesStatusFilter =
                isPast &&
                status !== 'cancelled' &&
                status !== 'suspended'
              break
            case 'active':
              matchesStatusFilter =
                !isPast &&
                status !== 'cancelled' &&
                status !== 'suspended'
              break
            case 'all':
            default:
              matchesStatusFilter = true
              break
          }

          const hasValidDate =
            eventDateTimestamp instanceof Timestamp

          return (
            matchesSearch &&
            matchesCategoryFilter &&
            matchesStatusFilter &&
            hasValidDate
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
        setLoading(false) // Restore setting loading false for initial load
      } else {
        setIsFetchingMore(false)
      }
    }
  }

  const handleSearchChange = (e) => {
    const newSearchTerm = e.target.value
    fetchEvents(newSearchTerm, filter, filterStatus, true)
    setSearchTerm(newSearchTerm)
  }

  const handleCategoryFilterChange = (e) => {
    const newFilter = e.target.value
    fetchEvents(searchTerm, newFilter, filterStatus, true)
    setFilter(newFilter)
  }

  const handleStatusFilterChange = (e) => {
    const newStatusFilter = e.target.value
    fetchEvents(searchTerm, filter, newStatusFilter, true)
    setFilterStatus(newStatusFilter)
  }

  const handleLoadMore = () => {
    if (!loading && !isFetchingMore && hasMore) {
      fetchEvents(searchTerm, filter, filterStatus, false)
    }
  }

  if (error) {
    throw error
  }

  return (
    <>
      <div className='flex flex-col md:flex-row items-center justify-center gap-4 mb-8'>
        <div className='relative w-full md:w-1/3'>
          <input
            type='text'
            placeholder='Buscar eventos, lugares, ciudades...'
            value={searchTerm}
            onChange={handleSearchChange}
            className='w-full px-4 py-2 border-2 border-gray-300 rounded-lg shadow-sm  focus:border-teal-500 pr-10 focus-visible:outline-none'
            disabled={loading || isFetchingMore}
          />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm('')
                fetchEvents('', filter, filterStatus, true)
              }}
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
            className='w-full md:w-48 px-4 py-2 border-2 border-gray-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500 appearance-none bg-white pr-8 cursor-pointer'
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
        <div className='relative w-full md:w-auto'>
          <select
            value={filterStatus}
            onChange={handleStatusFilterChange}
            className='w-full md:w-48 px-4 py-2 border-2 border-gray-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500 appearance-none bg-white pr-8 cursor-pointer'
            disabled={loading || isFetchingMore}
          >
            {STATUS_FILTERS.map((statusOption) => (
              <option
                key={statusOption.value}
                value={statusOption.value}
              >
                {statusOption.label}
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

      {/* Display loading skeletons while data is being
      fetched */}
      {loading && (
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8'>
          {Array.from({ length: ITEMS_PER_PAGE }).map(
            (_, index) => (
              <EventCardSkeleton
                key={`initial-skeleton-${index}`}
              />
            ),
          )}
        </div>
      )}

      {/* Display event cards when data is loaded */}
      {!loading && (
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8'>
          {eventsList.map((event) => (
            <EventCard
              key={event.id}
              onClick={() => openModal(event)}
              title={event.title}
              description={event.description}
              date={event.date}
              location={
                event.city || 'Ubicación no disponible'
              }
              image={event.image || '/placeholder.svg'}
              status={event.status || 'active'}
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
      {!loading && eventsList.length === 0 && (
        <p className='col-span-full text-center text-gray-500 py-10'>
          No se encontraron eventos que coincidan con los
          filtros.
        </p>
      )}

      {/* Show load more button if there are more events to
      fetch */}
      {!loading && !isFetchingMore && hasMore && (
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

'use client'

import { useState, useEffect } from 'react'
import { db } from '../../lib/firebase-client'
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  startAfter,
} from 'firebase/firestore'
import { CATEGORIES } from '../../lib/constants'
import { hasEventPassed } from '../../lib/utils'
import EventCard from '../../components/EventCard'
import EventDetailModal from '../../components/EventDetailModal'
import EventCardSkeleton from '../../components/EventCardSkeleton'

// Define status filter options (duplicated here for now, could be shared)
const STATUS_FILTERS = [
  { value: 'active', label: 'Próximos' },
  { value: 'past', label: 'Pasados' },
  { value: 'suspended', label: 'Suspendidos' },
  { value: 'cancelled', label: 'Cancelados' },
  { value: 'all', label: 'Todos' },
]

const ITEMS_PER_PAGE = 8 // Keep consistent with server fetch if applicable

const EventListView = ({
  initialEvents = [],
  initialHasMore = true,
}) => {
  const [eventsList, setEventsList] =
    useState(initialEvents)
  const [loading, setLoading] = useState(false) // Loading is for subsequent fetches
  const [lastVisible, setLastVisible] = useState(null) // Need to determine initial lastVisible from initialEvents if possible
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all') // Category filter
  const [filterStatus, setFilterStatus] = useState('all') // Status filter
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    setEventsList(initialEvents)
    setHasMore(initialHasMore)
  }, [initialEvents, initialHasMore])

  const openModal = (event) => {
    setSelectedEvent(event)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setSelectedEvent(null)
    setIsModalOpen(false)
  }

  // Fetching logic now primarily for loading more or filtering
  const fetchEvents = async (
    currentSearchTerm,
    currentCategoryFilter,
    currentStatusFilter,
    shouldReset = false,
  ) => {
    setLoading(true)

    let currentLastVisible = shouldReset
      ? null
      : lastVisible
    if (shouldReset) {
      setEventsList([]) // Clear list if resetting for filters/search
    }

    // --- Client-side Firebase Query ---
    // This remains largely the same as the original page.js logic
    // Consider abstracting this query logic if used elsewhere.
    let eventsQuery = query(
      collection(db, 'events'),
      orderBy('date', 'desc'),
      limit(ITEMS_PER_PAGE),
    )

    if (currentLastVisible) {
      eventsQuery = query(
        eventsQuery,
        startAfter(currentLastVisible),
      )
    }

    // NOTE: Applying WHERE clauses for status/category server-side is more efficient
    // but adds complexity. Client-side filtering is simpler to implement initially.
    // Example server-side additions (would need indexes):
    // if (currentCategoryFilter !== 'all') {
    //   eventsQuery = query(eventsQuery, where('category', '==', currentCategoryFilter));
    // }
    // Status filtering server-side is harder due to combinations with date.

    try {
      const eventsSnapshot = await getDocs(eventsQuery)
      const newEventsData = eventsSnapshot.docs.map(
        (doc) => ({
          id: doc.id,
          ...doc.data(),
        }),
      )

      // Client-side filtering based on ALL current filters
      const filteredNewEvents = newEventsData.filter(
        (event) => {
          const lowerSearchTerm =
            currentSearchTerm.toLowerCase()
          const isPast = hasEventPassed(event.date)
          const status = event.status || 'active'

          const matchesSearch =
            !currentSearchTerm || // Pass if no search term
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
            default:
              matchesStatusFilter = true
              break // 'all'
          }
          const hasValidDate =
            event.date && event.date.seconds

          return (
            matchesSearch &&
            matchesCategoryFilter &&
            matchesStatusFilter &&
            hasValidDate
          )
        },
      )

      setEventsList((prevEvents) =>
        shouldReset
          ? filteredNewEvents
          : [...prevEvents, ...filteredNewEvents],
      )

      const lastDocSnapshot =
        eventsSnapshot.docs[eventsSnapshot.docs.length - 1]
      setLastVisible(lastDocSnapshot || null) // Store the actual snapshot for pagination
      setHasMore(
        eventsSnapshot.docs.length === ITEMS_PER_PAGE,
      )
    } catch (error) {
      console.error(
        'Error fetching events client-side:',
        error,
      )
      // Handle error state if needed
    } finally {
      setLoading(false)
    }
  }

  // --- Event Handlers ---
  const handleSearchChange = (e) => {
    const newSearchTerm = e.target.value
    setSearchTerm(newSearchTerm)
    fetchEvents(newSearchTerm, filter, filterStatus, true) // Pass current state
  }

  const handleCategoryFilterChange = (e) => {
    const newFilter = e.target.value
    setFilter(newFilter)
    fetchEvents(searchTerm, newFilter, filterStatus, true) // Pass current state
  }

  const handleStatusFilterChange = (e) => {
    const newStatusFilter = e.target.value
    setFilterStatus(newStatusFilter)
    fetchEvents(searchTerm, filter, newStatusFilter, true) // Pass current state
  }

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchEvents(searchTerm, filter, filterStatus, false) // Fetch next page
    }
  }

  return (
    <>
      {/* Filter Controls */}
      <div className='flex flex-col md:flex-row items-center justify-center gap-4 mb-8'>
        {/* Search Input */}
        <div className='relative w-full md:w-1/3'>
          <input
            type='text'
            placeholder='Buscar eventos, lugares, ciudades...'
            value={searchTerm}
            onChange={handleSearchChange}
            className='w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500 pr-10'
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
              {/* X icon */}
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
        {/* Category Select */}
        <div className='relative w-full md:w-auto'>
          <select
            value={filter}
            onChange={handleCategoryFilterChange}
            className='w-full md:w-48 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500 appearance-none bg-white pr-8 cursor-pointer'
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
          {/* Arrow Icon for Select */}
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
        {/* Status Select */}
        <div className='relative w-full md:w-auto'>
          <select
            value={filterStatus}
            onChange={handleStatusFilterChange}
            className='w-full md:w-48 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500 appearance-none bg-white pr-8 cursor-pointer'
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
          {/* Arrow Icon for Select */}
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

      {/* Event List Rendering */}
      <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8'>
        {/* Initial state from props might be empty if server sent none */}
        {eventsList.length === 0 && !loading && (
          <p className='col-span-full text-center text-gray-500 py-10'>
            No se encontraron eventos que coincidan con los
            filtros.
          </p>
        )}

        {eventsList.map((event) => (
          <EventCard
            key={event.id}
            onClick={() => openModal(event)}
            // ... pass necessary props ...
            title={event.title}
            description={
              event.description
                ? event.description.substring(0, 100) +
                  '...'
                : ''
            }
            date={event.date}
            location={
              event.city || 'Ubicación no disponible'
            }
            image={
              event.featuredImage || '/placeholder.svg'
            }
            status={event.status || 'active'}
          />
        ))}

        {/* Loading More Skeletons */}
        {loading &&
          Array.from({ length: 4 }).map((_, index) => (
            <EventCardSkeleton
              key={`loading-more-${index}`}
            />
          ))}
      </div>

      {/* Load More Button */}
      {!loading && hasMore && (
        <div className='mt-12 text-center'>
          <button
            onClick={handleLoadMore}
            className='bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-6 rounded-full transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed'
            disabled={loading}
          >
            Cargar más
          </button>
        </div>
      )}

      {/* Event Detail Modal */}
      <EventDetailModal
        isOpen={isModalOpen}
        onClose={closeModal}
        event={selectedEvent}
      />
    </>
  )
}

export default EventListView

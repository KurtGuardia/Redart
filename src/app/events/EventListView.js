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
  Timestamp, // Import Timestamp for type checking if needed
} from 'firebase/firestore'
import { CATEGORIES } from '../../lib/constants'
import { hasEventPassed } from '../../lib/utils'
import EventCard from '../../components/EventCard'
import EventDetailModal from '../../components/EventDetailModal'
import EventCardSkeleton from '../../components/EventCardSkeleton'

// Define status filter options (duplicated here for now, could be shared)
const STATUS_FILTERS = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Próximos' },
  { value: 'past', label: 'Pasados' },
  { value: 'suspended', label: 'Suspendidos' },
  { value: 'cancelled', label: 'Cancelados' },
]

const ITEMS_PER_PAGE = 8

const EventListView = () => {
  const [eventsList, setEventsList] = useState([])
  const [loading, setLoading] = useState(true) // Start loading true for initial fetch
  const [lastVisible, setLastVisible] = useState(null)
  const [hasMore, setHasMore] = useState(true) // Assume has more initially
  const [fetchError, setFetchError] = useState(null) // Add error state

  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

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

  const fetchEvents = async (
    currentSearchTerm = '',
    currentCategoryFilter = 'all',
    currentStatusFilter = 'all',
    shouldReset = false,
  ) => {
    setLoading(true)
    setFetchError(null)

    let currentLastVisible = lastVisible
    if (shouldReset) {
      setEventsList([])
      currentLastVisible = null
      setLastVisible(null)
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

      setEventsList((prevEvents) =>
        shouldReset
          ? finalEvents
          : [...prevEvents, ...finalEvents],
      )

      const lastDocSnapshot =
        eventsSnapshot.docs[eventsSnapshot.docs.length - 1]
      setLastVisible(lastDocSnapshot || null)
      setHasMore(
        eventsSnapshot.docs.length === ITEMS_PER_PAGE,
      )
    } catch (error) {
      console.error(
        'Error fetching events client-side:',
        error,
      )
      setFetchError(error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearchChange = (e) => {
    const newSearchTerm = e.target.value
    setSearchTerm(newSearchTerm)
    fetchEvents(newSearchTerm, filter, filterStatus, true)
  }

  const handleCategoryFilterChange = (e) => {
    const newFilter = e.target.value
    setFilter(newFilter)
    fetchEvents(searchTerm, newFilter, filterStatus, true)
  }

  const handleStatusFilterChange = (e) => {
    const newStatusFilter = e.target.value
    setFilterStatus(newStatusFilter)
    fetchEvents(searchTerm, filter, newStatusFilter, true)
  }

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchEvents(searchTerm, filter, filterStatus, false)
    }
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
            disabled={loading}
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
            disabled={loading}
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
            disabled={loading}
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

      {fetchError && (
        <p className='col-span-full text-center text-red-500 py-10'>
          Error al cargar eventos:{' '}
          {fetchError.message || 'Error desconocido'}
        </p>
      )}

      <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8'>
        {loading &&
          eventsList.length === 0 &&
          Array.from({ length: ITEMS_PER_PAGE }).map(
            (_, index) => (
              <EventCardSkeleton
                key={`initial-skeleton-${index}`}
              />
            ),
          )}

        {!loading &&
          !fetchError &&
          eventsList.length === 0 && (
            <p className='col-span-full text-center text-gray-500 py-10'>
              No se encontraron eventos que coincidan con
              los filtros.
            </p>
          )}

        {eventsList.map((event) => (
          <EventCard
            key={event.id}
            onClick={() => openModal(event)}
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

        {loading &&
          eventsList.length > 0 &&
          Array.from({ length: 4 }).map((_, index) => (
            <EventCardSkeleton
              key={`loading-more-${index}`}
            />
          ))}
      </div>

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

      <EventDetailModal
        isOpen={isModalOpen}
        onClose={closeModal}
        event={selectedEvent}
      />
    </>
  )
}

export default EventListView

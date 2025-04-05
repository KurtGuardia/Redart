'use client'

import Spot from '../../components/ui/Spot'
import EventCard from '../../components/EventCard'
import EventDetailModal from '../../components/EventDetailModal'
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

const ITEMS_PER_PAGE = 8

// Define status filter options
const STATUS_FILTERS = [
  { value: 'active', label: 'Próximos' },
  { value: 'past', label: 'Pasados' },
  { value: 'suspended', label: 'Suspendidos' },
  { value: 'cancelled', label: 'Cancelados' },
  { value: 'all', label: 'Todos' },
]

export default function EventsPage() {
  const [eventsList, setEventsList] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastVisible, setLastVisible] = useState(null)
  const [hasMore, setHasMore] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const openModal = (event) => {
    setSelectedEvent(event)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setSelectedEvent(null)
    setIsModalOpen(false)
  }

  useEffect(() => {
    fetchEvents('', 'all', 'all', true)
  }, [])

  const fetchEvents = async (
    searchTerm = '',
    categoryFilter = 'all',
    statusFilter = 'all',
    shouldReset = false,
  ) => {
    setLoading(true)

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
      const newEvents = eventsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      const filteredEvents = newEvents.filter((event) => {
        const lowerSearchTerm = searchTerm.toLowerCase()
        const isPast = hasEventPassed(event.date)
        const status = event.status || 'active'

        const matchesSearch =
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
          categoryFilter === 'all' ||
          event.category === categoryFilter

        let matchesStatusFilter = false
        switch (statusFilter) {
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
          event.date && event.date.seconds

        return (
          matchesSearch &&
          matchesCategoryFilter &&
          matchesStatusFilter &&
          hasValidDate
        )
      })

      setEventsList((prevEvents) =>
        shouldReset
          ? filteredEvents
          : [...prevEvents, ...filteredEvents],
      )

      const lastDoc =
        eventsSnapshot.docs[eventsSnapshot.docs.length - 1]
      setLastVisible(lastDoc || null)

      setHasMore(
        eventsSnapshot.docs.length === ITEMS_PER_PAGE,
      )
    } catch (error) {
      console.error('Error fetching events:', error)
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
    <div className='relative container mx-auto my-24'>
      <Spot colorName={'SlateBlue'} />
      <Spot colorName={'Magenta'} />
      <Spot colorName={'red'} />
      <Spot colorName={'red'} />
      <Spot colorName={'Indigo'} />
      <h1>Próximos Eventos</h1>

      <div className='flex flex-col md:flex-row items-center justify-center gap-4 mb-8'>
        <div className='relative w-full md:w-1/3'>
          <input
            type='text'
            placeholder='Buscar eventos, lugares o ciudades...'
            value={searchTerm}
            onChange={handleSearchChange}
            className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--teal-500)] pr-10'
          />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm('')
                fetchEvents('', filter, filterStatus, true)
              }}
              className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'
              aria-label='Limpiar búsqueda'
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
            className='w-full md:w-auto appearance-none px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--teal-500)] bg-[var(--white)] pr-8 cursor-pointer'
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")",
              backgroundPosition: 'right 0.5rem center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '1.5em 1.5em',
            }}
          >
            <option value='all'>Categorias</option>
            {CATEGORIES.map((category) => (
              <option
                key={category.value}
                value={category.value}
              >
                {category.label}
              </option>
            ))}
          </select>
        </div>

        <div className='relative w-full md:w-auto'>
          <select
            value={filterStatus}
            onChange={handleStatusFilterChange}
            className='w-full md:w-auto appearance-none px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--teal-500)] bg-[var(--white)] pr-8 cursor-pointer'
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")",
              backgroundPosition: 'right 0.5rem center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '1.5em 1.5em',
            }}
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
        </div>
      </div>

      {loading && eventsList.length === 0 ? (
        <p className='text-center text-gray-500'>
          Cargando eventos...
        </p>
      ) : eventsList.length === 0 ? (
        <p className='text-center text-gray-500'>
          No se encontraron eventos que coincidan con los
          filtros seleccionados.
        </p>
      ) : (
        <>
          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8'>
            {eventsList.map((event) => (
              <EventCard
                key={event.id}
                onClick={() => openModal(event)}
                className='cursor-pointer'
                title={event.title}
                description={
                  event.description
                    ? // TODO improve character number
                      event.description.substring(0, 100) +
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
                venueName={event.venueName}
                venueId={event.venueId}
                status={event.status || 'active'}
              />
            ))}
          </div>
          {hasMore && (
            <div className='mt-8 text-center'>
              <button
                onClick={handleLoadMore}
                className='bg-[var(--teal-500)] text-[var(--white)] px-6 py-2 rounded-lg hover:bg-teal-700 transition duration-300 disabled:opacity-50'
                disabled={loading}
              >
                {loading ? 'Cargando...' : 'Cargar más'}
              </button>
            </div>
          )}
        </>
      )}

      <EventDetailModal
        isOpen={isModalOpen}
        onClose={closeModal}
        event={selectedEvent}
      />
    </div>
  )
}

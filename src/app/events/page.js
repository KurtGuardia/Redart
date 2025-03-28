'use client'

import Spot from '../../components/Spot'
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

const ITEMS_PER_PAGE = 8

// Define categories for the filter dropdown
const categories = [
  { value: 'all', label: 'Categorias' },
  { value: 'music', label: 'Música' },
  { value: 'art', label: 'Arte' },
  { value: 'theater', label: 'Teatro' },
  { value: 'dance', label: 'Danza' },
  { value: 'comedy', label: 'Comedia' },
  { value: 'workshop', label: 'Taller' },
  { value: 'other', label: 'Otro' },
]

// Helper function to get currency symbol from currency code
const getCurrencySymbol = (currencyCode) => {
  switch (currencyCode) {
    case 'USD':
      return '$'
    case 'EUR':
      return '€'
    case 'GBP':
      return '£'
    case 'BOB':
      return 'Bs'
    case 'BRL':
      return 'R$'
    case 'ARS':
      return '$'
    case 'CLP':
      return '$'
    case 'COP':
      return '$'
    case 'MXN':
      return '$'
    case 'PEN':
      return 'S/'
    case 'UYU':
      return '$U'
    case 'PYG':
      return '₲'
    default:
      return currencyCode || 'Bs' // Default to Bs if no currency code is provided
  }
}

export default function EventsPage() {
  const [eventsList, setEventsList] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastVisible, setLastVisible] = useState(null)
  const [hasMore, setHasMore] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all')
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
    fetchEvents('', 'all', true)
  }, [])

  const fetchEvents = async (
    searchTerm = '',
    filter = 'all',
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
        const matchesSearch =
          event.title
            .toLowerCase()
            .includes(lowerSearchTerm) ||
          event.description
            .toLowerCase()
            .includes(lowerSearchTerm) ||
          event.venueName
            ?.toLowerCase()
            .includes(lowerSearchTerm) ||
          event.city
            ?.toLowerCase()
            .includes(lowerSearchTerm)

        const matchesFilter =
          filter === 'all' || event.category === filter

        const hasValidDate =
          event.date && event.date.seconds

        return (
          matchesSearch && matchesFilter && hasValidDate
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
    fetchEvents(newSearchTerm, filter, true)
  }

  const handleFilterChange = (e) => {
    const newFilter = e.target.value
    setFilter(newFilter)
    fetchEvents(searchTerm, newFilter, true)
  }

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchEvents(searchTerm, filter, false)
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

      <div className='flex flex-col md:flex-row items-center justify-center md:space-x-4 mb-8'>
        {/* Search input container with relative positioning for the X icon */}
        <div className='relative w-full md:w-1/2 mb-4 md:mb-0'>
          <input
            type='text'
            placeholder='Buscar eventos, lugares o ciudades...'
            value={searchTerm}
            onChange={handleSearchChange}
            className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--teal-500)] pr-10'
          />
          {/* X icon to clear search input */}
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm('')
                fetchEvents('', filter, true)
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

        <div className='relative'>
          <select
            value={filter}
            onChange={handleFilterChange}
            className='w-full md:w-auto appearance-none px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--teal-500)] bg-[var(--white)] pr-8 cursor-pointer'
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")",
              backgroundPosition: 'right 0.5rem center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '1.5em 1.5em',
            }}
          >
            {categories.map((category) => (
              <option
                key={category.value}
                value={category.value}
              >
                {category.label}
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
          No se encontraron eventos que coincidan con tu
          búsqueda.
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
                    ? event.description.substring(0, 100) +
                      '...'
                    : ''
                }
                date={
                  event.date && event.date.seconds
                    ? new Date(
                        event.date.seconds * 1000,
                      ).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'Fecha no disponible'
                }
                location={
                  event.city || 'Ubicación no disponible'
                }
                image={
                  event.featuredImage || '/placeholder.svg'
                }
                venueName={event.venueName}
                venueId={event.venueId}
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

'use client'

import Spot from '../../components/Spot'
import EventCard from '../../components/EventCard'
import { useState, useEffect } from 'react'
import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
} from 'firebase/firestore'
import { db } from '../../lib/firebase-client'
import Link from 'next/link'

const ITEMS_PER_PAGE = 9

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

  useEffect(() => {
    fetchEvents('', 'all', true)
  }, [])

  const fetchEvents = async (
    searchTerm = '',
    filter = 'all',
    shouldReset = false,
  ) => {
    setLoading(true)

    // Reset the list and lastVisible when explicitly asked to reset
    if (shouldReset) {
      setEventsList([])
      setLastVisible(null)
    }

    let eventsQuery = query(
      collection(db, 'events'),
      orderBy('date', 'desc'),
      limit(ITEMS_PER_PAGE),
    )

    if (lastVisible && !shouldReset) {
      eventsQuery = query(
        eventsQuery,
        startAfter(lastVisible),
      )
    }

    const eventsSnapshot = await getDocs(eventsQuery)
    const eventsList = eventsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    // Apply client-side filtering
    const filteredEvents = eventsList.filter((event) => {
      const matchesSearch =
        event.title
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        event.description
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      const matchesFilter =
        filter === 'all' || event.category === filter
      return matchesSearch && matchesFilter
    })

    // Replace or append based on whether we're resetting
    setEventsList((prevEvents) =>
      shouldReset
        ? filteredEvents
        : [...prevEvents, ...filteredEvents],
    )

    // Update the lastVisible pointer for pagination
    const lastDoc =
      eventsSnapshot.docs[eventsSnapshot.docs.length - 1]
    setLastVisible(lastDoc || null)

    setHasMore(
      eventsSnapshot.docs.length === ITEMS_PER_PAGE,
    )
    setLoading(false)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    fetchEvents(searchTerm, filter, true)
  }

  const handleFilterChange = (e) => {
    setFilter(e.target.value)
    fetchEvents(searchTerm, e.target.value, true)
  }

  // Update the load more button click handler
  const handleLoadMore = () => {
    fetchEvents(searchTerm, filter, false)
  }

  return (
    <div className='relative container mx-auto my-24'>
      <Spot colorName={'SlateBlue'} />
      <Spot colorName={'Magenta'} />
      <Spot colorName={'red'} />
      <Spot colorName={'red'} />
      <Spot colorName={'Indigo'} />
      <h1>Todos los eventos</h1>
      <form
        onSubmit={handleSearch}
        className='mb-8 flex gap-4'
      >
        <input
          type='text'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder='Buscar eventos...'
          className='flex-grow px-4 py-2 rounded-lg border border-[var(--gray-300)] focus:outline-none focus:ring-2 focus:ring-[var(--teal-500)]'
        />
        <select
          value={filter}
          onChange={handleFilterChange}
          className='px-4 py-2 rounded-lg border border-[var(--gray-300)] focus:outline-none focus:ring-2 focus:ring-[var(--teal-500)]'
        >
          <option value='all'>Todas las categorías</option>
          <option value='music'>Música</option>
          <option value='art'>Arte</option>
          <option value='theater'>Teatro</option>
          <option value='dance'>Danza</option>
        </select>
        <button
          type='submit'
          className='bg-[var(--teal-500)] text-[var(--white)] px-6 py-2 rounded-lg hover:bg-teal-700 transition duration-300'
        >
          Buscar
        </button>
      </form>

      {loading && eventsList.length === 0 ? (
        // TODO: Add a loading spinner or something better
        <p>Cargando eventos...</p>
      ) : (
        <>
          <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 sm:md:grid-cols-2 gap-8'>
            {eventsList.map((event) => (
              <EventCard
                title={event.title}
                key={event.id}
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
                      ).toLocaleDateString()
                    : 'Fecha no disponible'
                }
                location={
                  event.city || 'Ubicación no disponible'
                }
                image={
                  event.featuredImage || '/placeholder.svg'
                }
              />
            ))}
          </div>
          {hasMore && (
            <div className='mt-8 text-center'>
              <button
                onClick={handleLoadMore}
                className='bg-[var(--teal-500)] text-[var(--white)] px-6 py-2 rounded-lg hover:bg-teal-700 transition duration-300'
                disabled={loading}
              >
                {loading ? 'Cargando...' : 'Cargar más'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

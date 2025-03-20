'use client'

import Spot from '../../components/Spot'
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
import MapComponent from '@/src/components/MapComponent'

const ITEMS_PER_PAGE = 9

export default function EventsPage() {
  const [eventsList, setEventsList] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastVisible, setLastVisible] = useState(null)
  const [hasMore, setHasMore] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all')

  // useEffect(() => {
  //   fetchEvents()
  // }, [])

  // const fetchEvents = async ( searchTerm = "", filter = "all" ) => {
  //   setLoading( true )
  //   let eventsQuery = query( collection( db, "events" ), orderBy( "date", "desc" ), limit( ITEMS_PER_PAGE ) )

  //   if ( lastVisible ) {
  //     eventsQuery = query( eventsQuery, startAfter( lastVisible ) )
  //   }

  //   const eventsSnapshot = await getDocs( eventsQuery )
  //   const eventsList = eventsSnapshot.docs.map( ( doc ) => ( { id: doc.id, ...doc.data() } ) )

  //   // Apply client-side filtering
  //   const filteredEvents = eventsList.filter( ( event ) => {
  //     const matchesSearch =
  //       event.title.toLowerCase().includes( searchTerm.toLowerCase() ) ||
  //       event.description.toLowerCase().includes( searchTerm.toLowerCase() )
  //     const matchesFilter = filter === "all" || event.category === filter
  //     return matchesSearch && matchesFilter
  //   } )

  //   setEventsList( ( prevEvents ) => [...prevEvents, ...filteredEvents] )
  //   setLastVisible( eventsSnapshot.docs[eventsSnapshot.docs.length - 1] )
  //   setHasMore( eventsSnapshot.docs.length === ITEMS_PER_PAGE )
  //   setLoading( false )
  // }

  const handleSearch = (e) => {
    e.preventDefault()
    setEventsList([])
    setLastVisible(null)
    fetchEvents(searchTerm, filter)
  }

  const handleFilterChange = (e) => {
    setFilter(e.target.value)
    setEventsList([])
    setLastVisible(null)
    fetchEvents(searchTerm, e.target.value)
  }

  return (
    <div className='relative container mx-auto px-4 py-8'>
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
        <p>Cargando eventos...</p>
      ) : (
        <>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
            {eventsList.map((event) => (
              <Link
                className='bg-[var(--white)] rounded-lg shadow-md overflow-hidden hover:shadow-lg transition duration-300'
                href={`/events/${event.id}`}
                key={event.id}
              >
                <img
                  src={event.imageUrl || '/placeholder.svg'}
                  alt={event.title}
                  className='w-full h-48 object-cover'
                />
                <div className='p-4'>
                  <h3 className='text-xl font-semibold mb-2'>
                    {event.title}
                  </h3>
                  <p className='text-[var(--gray-600)] mb-2'>
                    {event.description.substring(0, 100)}
                    ...
                  </p>
                  <div className='flex justify-between text-sm text-[var(--gray-500)]'>
                    <span>{event.date}</span>
                    <span>{event.location}</span>
                    <span>{event.price}</span>
                  </div>
                  <Link href={`/spaces/${event.spaceId}`}>
                    Ver ubicación
                  </Link>
                </div>
              </Link>
            ))}
          </div>
          {hasMore && (
            <div className='mt-8 text-center'>
              <button
                onClick={() =>
                  fetchEvents(searchTerm, filter)
                }
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

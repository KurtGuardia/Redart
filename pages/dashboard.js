'use client'

import Layout from '../components/Layout'
import { useState, useEffect } from 'react'
import { auth, db } from '../lib/firebase-client'
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from 'firebase/firestore'
import { useRouter } from 'next/router'
import Spot from '../components/Spot'
import dynamic from 'next/dynamic'

const MapComponent = dynamic( () => import( '../components/MapComponent' ), {
  ssr: false
} )

export default function Dashboard () {
  const [eventTitle, setEventTitle] = useState( '' );
  const [eventDate, setEventDate] = useState( '' );

  const handleAddEvent = async ( e ) => {
    e.preventDefault();

    const newEventData = {
      title: eventTitle,
      date: Timestamp.fromDate( new Date( eventDate ) ),
      venueId: user.uid, // Assuming the user's UID is the venue ID
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    try {
      const eventId = await addEvent( newEventData );
      console.log( 'Event added with ID:', eventId );
      setEvents( [...events, { id: eventId, ...newEventData }] );
      setEventTitle( '' );
      setEventDate( '' );
    } catch ( error ) {
      console.error( 'Error adding event:', error );
    }
  };
  const router = useRouter()
  const [user, setUser] = useState( null )
  const [loading, setLoading] = useState( true )
  const [events, setEvents] = useState( [] )

  const fetchUserData = async ( uid ) => {
    try {
      // Fetch user's events
      const eventsQuery = query(
        collection( db, 'events' ),
        where( 'venueId', '==', uid )
      );
      const eventsSnapshot = await getDocs( eventsQuery );
      const eventsData = eventsSnapshot.docs.map( doc => ( {
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate() // Convert Firestore timestamp to JS Date
      } ) );

      // Update state with fetched data
      setEvents( eventsData );
    } catch ( error ) {
      console.error( 'Error fetching user data:', error );
      // Handle error appropriately
    }
  };

  useEffect( () => {
    const unsubscribe = auth.onAuthStateChanged( ( currentUser ) => {
      if ( currentUser ) {
        setUser( currentUser )
        fetchUserData( currentUser.uid )
      } else {
        router.replace( '/login' )
      }
      setLoading( false )
    } )

    return () => unsubscribe()
  }, [router] )

  if ( loading ) {
    return <div>Loading...</div>
  }

  if ( !user ) {
    return null // Will redirect in useEffect
  }

  return (
    <Layout>
      <div className='relative container mx-auto px-4 py-8'>
        <Spot colorName={'red'} />
        <Spot colorName={'indigo'} />
        <Spot colorName={'peru'} />
        <div className='bg-gradient-to-r from-teal-500 to-blue-500 rounded-lg shadow-lg p-6 mb-8'>
          <h1 className='text-3xl font-bold text-white'>
            Bienvenido administrador de: {user.displayName}
          </h1>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
          <div className='bg-white rounded-lg shadow-lg p-6'>
            <h2 className='text-2xl font-semibold mb-4 text-gray-800 flex items-center'>
              <svg className='w-6 h-6 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' />
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 11a3 3 0 11-6 0 3 3 0 016 0z' />
              </svg>
              Mi espacio
            </h2>
            <div className='rounded-lg overflow-hidden shadow-md'>
              <MapComponent
                user={user}
                center={[-17.3938, -66.1570]} // Cochabamba coordinates
                zoom={13}
              />
            </div>
          </div>

          <div className='bg-white rounded-lg shadow-lg p-6'>
            <h2 className='text-2xl font-semibold mb-4 text-gray-800 flex items-center'>
              <svg className='w-6 h-6 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' />
              </svg>
              Mis eventos
            </h2>
            {events.length === 0 ? (
              <div className='text-center py-8 text-gray-500'>
                <svg className='w-16 h-16 mx-auto mb-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' />
                </svg>
                <p>No tienes eventos registrados.</p>
              </div>
            ) : (
              <ul className='space-y-3 mb-6'>
                {events.map( ( event ) => (
                  <li
                    key={event.id}
                    className='bg-gray-50 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200'
                  >
                    <h3 className='font-semibold text-gray-800'>
                      {event.title}
                    </h3>
                    <p className='text-sm text-gray-600 mt-1'>
                      {new Date( event.date.seconds * 1000 ).toLocaleDateString( 'es-ES', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      } )}
                    </p>
                  </li>
                ) )}
              </ul>
            )}
            <form onSubmit={handleAddEvent} className='space-y-4 mt-6 bg-gray-50 p-4 rounded-lg'>
              <div>
                <label htmlFor='eventTitle' className='block text-sm font-medium text-gray-700 mb-1'>Título del evento</label>
                <input
                  id='eventTitle'
                  type='text'
                  placeholder='Ej: Concierto de Jazz'
                  value={eventTitle}
                  onChange={( e ) => setEventTitle( e.target.value )}
                  className='w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent'
                  required
                />
              </div>
              <div>
                <label htmlFor='eventDate' className='block text-sm font-medium text-gray-700 mb-1'>Fecha y hora</label>
                <input
                  id='eventDate'
                  type='datetime-local'
                  value={eventDate}
                  onChange={( e ) => setEventDate( e.target.value )}
                  className='w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent'
                  required
                />
              </div>
              <button
                type='submit'
                className='w-full py-2 px-4 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-medium rounded-md hover:from-teal-600 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition duration-200'
              >
                <span className='flex items-center justify-center'>
                  <svg className='w-5 h-5 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 6v6m0 0v6m0-6h6m-6 0H6' />
                  </svg>
                  Agregar evento
                </span>
              </button>
            </form>
          </div>
        </div>
      </div>
      <div className='w-fit mx-auto p-4'>
        <button
          onClick={async () => {
            try {
              await auth.signOut()
              router.push( '/login' )
            } catch ( error ) {
              console.error( 'Error signing out:', error )
            }
          }}
          className='w-full py-2 px-4 bg-red-500 text-white font-medium rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2'
        >
          Cerrar sesión
        </button>
      </div>
    </Layout>
  )
}

'use client'

import Layout from '../components/Layout'
import { useState, useEffect } from 'react'
import { auth, db } from '../lib/firebase-client'
import {
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [spaces, setSpaces] = useState( [] )
  const [events, setEvents] = useState( [] )

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

  const fetchUserData = async ( userId ) => {
    const spacesQuery = query(
      collection( db, 'spaces' ),
      where( 'userId', '==', userId ),
    )
    const eventsQuery = query(
      collection( db, 'events' ),
      where( 'userId', '==', userId ),
    )

    const [spacesSnapshot, eventsSnapshot] =
      await Promise.all( [
        getDocs( spacesQuery ),
        getDocs( eventsQuery ),
      ] )

    setSpaces(
      spacesSnapshot.docs.map( ( doc ) => ( {
        id: doc.id,
        ...doc.data(),
      } ) ),
    )
    setEvents(
      eventsSnapshot.docs.map( ( doc ) => ( {
        id: doc.id,
        ...doc.data(),
      } ) ),
    )
  }

  if ( loading ) {
    return <div>Loading...</div>
  }

  if ( !user ) {
    return null // Will redirect in useEffect
  }

  return (
    <Layout>
      <div className='container mx-auto px-4 py-8'>
        <h1 className='text-3xl font-bold mb-8'>
          Bienvenido, {user.displayName}
        </h1>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
          <div>
            <h2 className='text-2xl font-semibold mb-4'>
              Mis espacios
            </h2>
            {spaces.length === 0 ? (
              <p>No tienes espacios registrados.</p>
            ) : (
              <ul className='space-y-2'>
                {spaces.map( ( space ) => (
                  <li
                    key={space.id}
                    className='bg-[var(--white)] p-4 rounded-lg shadow'
                  >
                    <h3 className='font-semibold'>
                      {space.name}
                    </h3>
                    <p className='text-sm text-[var(--gray-600)]'>
                      {space.address}
                    </p>
                  </li>
                ) )}
              </ul>
            )}
            <Link
              className='mt-4 inline-block bg-[var(--teal-500)] text-[var(--white)] py-2 px-4 rounded-md hover:bg-teal-700 transition duration-300'
              href='/add-space'
            >
              Agregar espacio
            </Link>
          </div>

          <div>
            <h2 className='text-2xl font-semibold mb-4'>
              Mis eventos
            </h2>
            {events.length === 0 ? (
              <p>No tienes eventos registrados.</p>
            ) : (
              <ul className='space-y-2'>
                {events.map( ( event ) => (
                  <li
                    key={event.id}
                    className='bg-[var(--white)] p-4 rounded-lg shadow'
                  >
                    <h3 className='font-semibold'>
                      {event.title}
                    </h3>
                    <p className='text-sm text-[var(--gray-600)]'>
                      {event.date}
                    </p>
                  </li>
                ) )}
              </ul>
            )}
            <Link
              className='mt-4 inline-block bg-[var(--teal-500)] text-[var(--white)] py-2 px-4 rounded-md hover:bg-teal-700 transition duration-300'
              href='/add-event'
            >
              Agregar evento
            </Link>
          </div>
        </div>
      </div>
      <div className='w-fit mx-auto p-4'>
        <button
          onClick={async () => {
            try {
              await auth.signOut()
              router.push('/login')
            } catch (error) {
              console.error('Error signing out:', error)
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

'use client'
import Link from 'next/link'
import MapView from '../../components/map/MapView'
import VenueList from '../../components/venue/VenueList'
import { useState } from 'react'
import Spots from '../../components/ui/Spots'

export default function MapPage() {
  const [tab, setTab] = useState('map')

  return (
    <div className='map relative container mx-auto my-24'>
      <Spots count={8} />

      <h1>Descubre la movida cultural que tengas cerca!</h1>

      {/* Tabs */}
      <div className='flex justify-center mt-8 mb-6'>
        <button
          className={`px-6 py-2 rounded-l-full font-semibold border-t border-b border-l border-gray-300 focus:outline-none transition-colors duration-200 ${
            tab === 'map'
              ? 'bg-teal-600 text-white'
              : 'bg-white text-teal-700 hover:bg-teal-50'
          }`}
          onClick={() => setTab('map')}
        >
          Mapa
        </button>
        <button
          className={`px-6 py-2 rounded-r-full font-semibold border-t border-b border-r border-gray-300 focus:outline-none transition-colors duration-200 ${
            tab === 'list'
              ? 'bg-teal-600 text-white'
              : 'bg-white text-teal-700 hover:bg-teal-50'
          }`}
          onClick={() => setTab('list')}
        >
          Lista
        </button>
      </div>

      {tab === 'map' && <MapView />}
      {tab === 'list' && <VenueList />}

      <div className='text-center mt-8'>
        <Link
          href='/'
          className='bg-[var(--teal-500)] text-[var(--white)] px-6 py-2 rounded-full text-lg font-semibold hover:bg-teal-700 hover:text-white transition duration-300 '
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}

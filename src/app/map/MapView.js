'use client'

import { useState } from 'react'
import MapComponent from '../../components/MapComponent'
import { useVenueLocations } from '../../hooks/useVenueLocations' // Remove if only using initial data
import Link from 'next/link'

export default function MapView() {
  const { locations, loading, error } = useVenueLocations()

  return (
    <div className='w-full mx-auto rounded-lg overflow-hidden'>
      {loading ? (
        <div className='flex justify-center items-center h-full bg-gray-100'>
          <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500'></div>
        </div>
      ) : error ? (
        <div className='text-center text-red-500 h-full flex flex-col justify-center items-center bg-red-50 p-4'>
          <p>
            Error al cargar los lugares:{' '}
            {error.message || error}
          </p>
        </div>
      ) : locations && locations.length > 0 ? (
        <>
          <MapComponent
            center={[-17.389499, -66.156123]}
            zoom={13}
            venues={locations}
          />

          <div className='bg-[var(--blue-800-transparent)] text-[var(--white)] p-2 my-4 rounded-lg w-fit mx-auto text-sm'>
            Mostrando {locations.length}{' '}
            {locations.length === 1
              ? 'espacio cultural'
              : 'espacios culturales'}
          </div>

          <ul className='list-disc pl-5 text-[var(--primary)]'>
            {locations.map((location) => (
              <li key={location.id} className='my-2 p-2'>
                <Link
                  href={`/venues/${location.id}`}
                  className='font-semibold text-[var(--primary)]'
                >
                  {location.name}
                </Link>
                :{' '}
                <span className='text-[var(--teal-700)]'>
                  {location.address}
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div className='text-center h-full flex flex-col justify-center items-center bg-gray-100 p-4'>
          <p className='text-gray-700 mb-4'>
            No hay lugares disponibles para mostrar en el
            mapa.
          </p>
        </div>
      )}
    </div>
  )
}

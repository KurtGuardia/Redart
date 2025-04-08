'use client'

import { useState } from 'react'
import MapComponent from '../../components/MapComponent'
import { useVenueLocations } from '../../hooks/useVenueLocations'
import Link from 'next/link'
import { Skeleton } from '../../components/ui/Skeleton'
import { usePathname } from 'next/navigation'
import Image from 'next/image'

export default function MapView() {
  const { locations, loading, error } = useVenueLocations()
  const pathname = usePathname()
  const isHomePage = pathname === '/'
  console.log(isHomePage)

  return (
    <div
      className={`mx-auto rounded-lg overflow-hidden ${
        isHomePage ? 'w-[60%]' : 'w-full'
      }`}
    >
      {loading ? (
        <Skeleton className='w-full h-[60vh]' />
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
            zoom={14}
            venues={locations}
          />

          {!isHomePage && (
            <>
              <div className='bg-[var(--blue-800-transparent)] text-[var(--white)] p-2 mt-4 mb-8 rounded-lg w-fit mx-auto text-sm'>
                Mostrando {locations.length}{' '}
                {locations.length === 1
                  ? 'espacio cultural'
                  : 'espacios culturales'}
              </div>

              <ul className='list-disc pl-5 text-[var(--primary)]'>
                {locations.map((location) => (
                  <li
                    key={location.id}
                    className='my-2 p-2 relative group'
                  >
                    <Link
                      href={`/venues/${location.id}`}
                      className='font-semibold text-[var(--primary)] hover:underline'
                    >
                      {location.name}:{' '}
                      <span className='text-[var(--teal-700)]'>
                        {location.address}
                      </span>
                      {location.logo && (
                        <div className='hidden group-hover:block absolute z-10 -top-24 left-0 w-24 h-24 p-1 bg-white rounded-md shadow-lg border border-gray-200'>
                          <Image
                            src={location.logo}
                            alt={`${location.name} logo`}
                            width={96}
                            height={96}
                            className='object-contain w-full h-full'
                          />
                        </div>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
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

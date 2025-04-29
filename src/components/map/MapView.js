'use client'

import MapComponent from '../map/MapComponent'
import { useVenueLocations } from '../../hooks/useVenueLocations'
import { Skeleton } from '../ui/Skeleton'
import { usePathname } from 'next/navigation'

export default function MapView({ ...props }) {
  const { locations, loading, error } = useVenueLocations()
  const pathname = usePathname()
  const isHomePage = pathname === '/'

  if (error) {
    throw error
  }

  if (loading || !locations) {
    return (
      <div className='flex flex-col gap-4 w-full max-w-4xl mx-auto bg-gray-100/50 rounded-xl shadow-md p-6 animate-pulse'>
        <div className='flex gap-2 mb-4'>
          <Skeleton className='h-10 w-full rounded-md bg-gray-300' />
          <Skeleton className='h-10 w-24 rounded-md bg-gray-300' />
        </div>
        <Skeleton className='w-full h-[350px] rounded-lg bg-gray-300' />
      </div>
    )
  }

  return (
    <div
      className={`mx-auto rounded-lg overflow-hidden ${
        isHomePage ? 'w-[80%]' : 'w-full'
      }`}
    >
      {locations.length > 0 ? (
        <>
          <MapComponent
            center={[-17.389499, -66.156123]}
            zoom={14}
            venues={locations}
            {...props}
          />
        </>
      ) : (
        <div className='text-center h-[60vh] flex flex-col justify-center items-center bg-gray-100 p-4'>
          <p className='text-gray-700 mb-4'>
            No hay lugares disponibles para mostrar en el
            mapa.
          </p>
        </div>
      )}
    </div>
  )
}

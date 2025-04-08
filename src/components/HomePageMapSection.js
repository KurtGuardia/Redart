'use client'

import { useVenueLocations } from '../hooks/useVenueLocations'
import MapComponent from './MapComponent'
import { Skeleton } from './ui/Skeleton'

const HomePageMapSection = () => {
  const { locations, loading, error } = useVenueLocations()

  return (
    <div className='w-full md:w-[70%] h-[60vh] mx-auto rounded-lg overflow-hidden shadow-lg'>
      {loading ? (
        <Skeleton className='w-full h-full' /> // Use Skeleton component
      ) : error ? (
        <div className='text-center text-red-500 h-full flex flex-col justify-center items-center bg-red-50 p-4'>
          <p className='font-semibold'>
            Error al cargar el mapa:
          </p>
          <p>{error.message || error}</p>
        </div>
      ) : locations && locations.length > 0 ? (
        <MapComponent
          center={[-17.389499, -66.156123]}
          venues={locations}
        />
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

export default HomePageMapSection

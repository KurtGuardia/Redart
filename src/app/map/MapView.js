'use client'

import { useState } from 'react' // Keep useState if needed for client-side map interactions
import MapComponent from '../../components/MapComponent'
// import { useVenueLocations } from '../../hooks/useVenueLocations'; // Remove if only using initial data

export default function MapView({ initialLocations }) {
  // Option 1: Just use initial data from server
  const locations = initialLocations
  const loading = false // Data is pre-loaded
  const error = null

  // Option 2: Use initial data, but allow client-side hook for potential updates/refreshes
  // const { locations: dynamicLocations, loading, error } = useVenueLocations(initialLocations);
  // const locations = dynamicLocations || initialLocations; // Prioritize dynamic if available

  return (
    <div className='w-full h-[60vh] mx-auto rounded-lg overflow-hidden shadow-lg'>
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
        <MapComponent
          center={[-17.389499, -66.156123]} // Or calculate center based on locations
          zoom={13} // Adjust zoom back to a reasonable default like 13
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
      {/* Maybe display count here if needed, passing locations.length? */}
    </div>
  )
}

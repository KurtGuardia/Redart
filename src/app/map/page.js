'use client'

import Link from 'next/link'
import Spot from '../../components/ui/Spot'
import MapComponent from '../../components/MapComponent'
import { useVenueLocations } from '../../hooks/useVenueLocations'

export default function MapPage() {
  const { locations, loading, error } = useVenueLocations()

  return (
    <div className='map relative container mx-auto my-24'>
      <Spot colorName={'chartreuse'} />
      <Spot colorName={'magenta'} />
      <Spot colorName={'red'} />
      <Spot colorName={'Indigo'} />
      <Spot colorName={'indigo'} />
      <h1>Descubre la movida cultural que tengas cerca!</h1>

      {loading ? (
        <div className='flex justify-center items-center h-[50vh]'>
          <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500'></div>
        </div>
      ) : error ? (
        <div className='text-center text-red-500 h-[50vh] flex flex-col justify-center'>
          <p>Error al cargar los lugares: {error}</p>
          <Link
            href='/'
            className='mt-4 inline-block bg-teal-500 text-white px-6 py-2 rounded-full'
          >
            Volver al inicio
          </Link>
        </div>
      ) : locations.length === 0 ? (
        <div className='text-center h-[50vh] flex flex-col justify-center'>
          <p className='text-gray-700 mb-4'>
            No hay lugares disponibles en este momento.
          </p>
          <p className='text-gray-500 mb-8'>
            ¡Sé el primero en registrar tu espacio cultural!
          </p>
          <Link
            href='/register'
            className='inline-block bg-teal-500 text-white px-6 py-2 rounded-full'
          >
            Registrar mi espacio
          </Link>
        </div>
      ) : (
        <div className='w-[700px] h-[50vh] mx-auto'>
          <MapComponent
            center={[-17.389499, -66.156123]}
            zoom={12}
            venues={locations}
          />
          <div className='bg-[var(--blue-800-transparent)] text-[var(--white)] p-2 my-2 rounded-lg w-fit mx-auto text-sm'>
            Mostrando {locations.length}{' '}
            {locations.length === 1
              ? 'espacio cultural'
              : 'espacios culturales'}
          </div>
        </div>
      )}

      <div className='text-center mt-16'>
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

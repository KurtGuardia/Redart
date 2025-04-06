import Link from 'next/link'
import Spot from '../../components/ui/Spot'
import MapView from './MapView'
import { getAllVenueLocations } from '../../lib/venueService'

export default async function MapPage() {
  console.log('[MapPage] FUNCTION ENTRY POINT.')
  let initialLocations = []
  let fetchError = null

  try {
    console.log(
      '[MapPage] Attempting to call getAllVenueLocations...',
    )
    initialLocations = await getAllVenueLocations()
    console.log(
      '[MapPage] getAllVenueLocations call FINISHED.',
    )
  } catch (error) {
    console.error(
      '[MapPage] Error calling or processing getAllVenueLocations:',
      error,
    )
    fetchError =
      error.message || 'Error al cargar localizaciones.'
  }

  return (
    <div className='map relative container mx-auto my-24'>
      <Spot colorName={'chartreuse'} />
      <Spot colorName={'magenta'} />
      <Spot colorName={'red'} />
      <Spot colorName={'Indigo'} />
      <Spot colorName={'indigo'} />
      <h1>Descubre la movida cultural que tengas cerca!</h1>

      {fetchError ? (
        <div className='text-center text-red-500 h-[60vh] flex flex-col justify-center items-center bg-red-50 p-4 rounded-lg shadow-lg'>
          <p className='font-semibold'>
            Error al cargar el mapa:
          </p>
          <p>{fetchError}</p>
          <Link
            href='/'
            className='mt-4 inline-block bg-teal-500 text-white px-6 py-2 rounded-full'
          >
            Volver al inicio
          </Link>
        </div>
      ) : (
        <MapView initialLocations={initialLocations} />
      )}

      {!fetchError && (
        <div className='bg-[var(--blue-800-transparent)] text-[var(--white)] p-2 my-4 rounded-lg w-fit mx-auto text-sm'>
          Mostrando {initialLocations.length}{' '}
          {initialLocations.length === 1
            ? 'espacio cultural'
            : 'espacios culturales'}
        </div>
      )}

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

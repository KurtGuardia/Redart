import Link from 'next/link'
import Spot from '../../components/ui/Spot'
import MapView from '../../components/map/MapView'

export default async function MapPage() {
  return (
    <div className='map relative container mx-auto my-24'>
      <Spot colorName={'chartreuse'} />
      <Spot colorName={'magenta'} />
      <Spot colorName={'red'} />
      <Spot colorName={'Indigo'} />
      <Spot colorName={'indigo'} />

      <h1>Descubre la movida cultural que tengas cerca!</h1>

      <MapView />

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

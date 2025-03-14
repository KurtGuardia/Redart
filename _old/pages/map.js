import Layout from '../components/Layout'
import Link from 'next/link'
import Spot from '../components/Spot'
import MapComponent from '../components/MapComponent'

export default function MapPage () {
  return (
    <Layout>
      <section className='map py-16'>
        <div className='relative container mx-auto px-4'>
          <Spot colorName={'chartreuse'} />
          <Spot colorName={'magenta'} />
          <Spot colorName={'red'} />
          <Spot colorName={'Indigo'} />
          <Spot colorName={'indigo'} />
          <h2 className='text-3xl font-bold text-center mb-8'>
            Mapa de Cochabamba
          </h2>
          <div className='w-[700px] h-[50vh] mx-auto'>
            <MapComponent
              center={[-17.389499, -66.156123]}
              zoom={14}
            />
          </div>
          <div className='text-center mt-16'>
            <Link
              href='/'
              className='bg-[var(--teal-500)] text-[var(--white)] px-6 py-2 rounded-full text-lg font-semibold hover:bg-teal-700 hover:text-white transition duration-300 '
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  )
}

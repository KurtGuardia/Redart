import Layout from '../components/Layout'
import Link from 'next/link'
import Spot from '../components/Spot'

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
          <div className='aspect-w-16 aspect-h-9 mb-8'>
            <iframe
              src='https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3926.566998769668!2d-66.1638644853766!3d-17.3946786882227!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x916084c66066666d%3A0x2660c7a266a66a6a!2sCochabamba!5e0!3m2!1sen!2sbo!4v1709043805777!5m2!1sen!2sbo'
              width='70%'
              height='500px'
              style={{
                border: 0,
                margin: 'auto',
                borderRadius: '10px',
              }}
              loading='lazy'
              referrerPolicy='no-referrer-when-downgrade'
            />
          </div>
          <div className='text-center mt-32'>
            <Link
              href='/'
              className='bg-[var(--color-teal-500)] text-[var(--color-white)] px-6 py-2 rounded-full text-lg font-semibold hover:bg-teal-700 hover:text-white transition duration-300 '
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  )
}

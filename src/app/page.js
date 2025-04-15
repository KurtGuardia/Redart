import Link from 'next/link'
import Spot from '../components/ui/Spot'
import HeroBackgroundSlider from '../components/HeroBackgroundSlider'
import MapView from '../components/map/MapView'
import FeaturedEventsList from '../components/event/FeaturedEventsList'

export default function HomePage () {
  const heroImages = [
    '/theater.jpg',
    '/carnival.jpg',
    '/guitarist.jpg',
  ]

  return (
    <>
      <div className='absolute top-0 left-0 right-0 opacity-80 bg-gradient-to-r from-[var(--secondary-color)] to-[var(--primary)] h-[80vh]' />
      <HeroBackgroundSlider images={heroImages}>
        <div className='container mx-auto px-4 z-10 text-center flex flex-col justify-between gap-4 bg-white bg-opacity-25 rounded-3xl py-10'>
          <h1 className='text-4xl text-[var(--white)] md:text-6xl font-bold md:leading-[150%] mb-4 animate-fade-in-up'>
            Descubre la vibrante escena artística de Bolivia
          </h1>
          <p className='font-semibold text-2xl max-w-2xl mx-auto mb-8 animate-fade-in-up'>
            Encuentra eventos, espacios y artistas en tu
            ciudad
          </p>
          <Link
            href='/events'
            className='bg-[var(--white)] text-[var(--blue-500)] px-8 py-3 rounded-xl shadow-md text-lg font-semibold hover:bg-[#7928ca] hover:text-[var(--secondary-color)] transition duration-300 animate-fade-in-up w-fit mx-auto'
          >
            Explorar eventos
          </Link>
        </div>
      </HeroBackgroundSlider>

      <FeaturedEventsList />

      <section
        className='about-us img relative my-24'
        style={{ backgroundImage: `url(${'/crowd.jpg'})` }}
      >
        <div className='relative z-10 py-28 mx-auto px-4 text-center text-white h-[500px]'>
          <h2 className='text-5xl font-bold mb-12'>
            Sobre nosotros
          </h2>
          <p className='text-2xl font-semibold mx-auto mb-14 leading-relaxed px-8 text-center'>
            Radart conecta artistas, espacios y amantes del
            arte en Bolivia. Nuestra misión es visibilizar
            la cultura y crear una comunidad que celebre la
            creatividad. Únete a nosotros y construyamos
            juntos este movimiento.
          </p>
          <div className='text-center'>
            <Link
              href='/faq'
              className='text-[var(--secondary-color-foreground)] rounded-full text-lg font-semibold bg-[var(--white)] px-8 py-3 shadow-md hover:bg-[#7928ca] hover:text-[var(--secondary-color)] transition duration-300 animate-fade-in-up w-fit mx-auto'
            >
              Preguntas frecuentes
            </Link>
          </div>
        </div>
        <div className='w-full absolute top-0 left-0 bg-[var(--teal-700)] opacity-70  h-[500px]' />
      </section>

      <section className='map py-16 my-24'>
        <div className='relative container mx-auto px-4'>
          <Spot colorName={'OliveDrab'} />
          <Spot colorName={'Teal'} />
          <Spot colorName={'Chartreuse'} />
          <Spot colorName={'Coral'} />
          <h2 className='text-3xl font-bold text-center mb-8 bg-gradient-to-r from-[var(--blue-600)] to-[var(--blue-900)] bg-clip-text text-transparent px-6 py-3 rounded-lg'>
            Explora los espacios culturales
          </h2>
          <p className='text-center text-xl font-light mb-12'>
            En Radart te damos la oportunidad de explorar
            los espacios culturales de Bolivia. Encuentra el
            tuyo preferido y conoce la programación de
            eventos.
          </p>
          <MapView />
        </div>
      </section>

      <section className='join text-center container mx-auto mb-48'>
        <h2 className='text-3xl font-bold text-center mb-8 bg-gradient-to-r from-[var(--blue-600)] to-[var(--blue-900)] bg-clip-text text-transparent px-6 py-3 rounded-lg transform-gpu hover:scale-105 transition-transform'>
          ¿Quieres unirte a la comunidad de Radart?
        </h2>
        <p className='text-center text-xl font-semibold max-w-2xl mx-auto mb-8 animate-fade-in-up'>
          ¡Únete a la movida cultural y muestra tus
          actividades!
          <br /> ¿Eres un espacio artistico? Crea tu cuenta
          y conecta con tu potencial audiencia mostrando tus
          eventos.
        </p>
        <Link
          href='/register'
          className='shadow-[var(--shadow)] bg-[var(--secondary-color)] text-[var(--secondary-color-foreground)] hover:text-white px-6 py-2 rounded-full text-lg font-semibold hover:bg-teal-700 transition duration-300'
        >
          Crear cuenta
        </Link>
      </section>
    </>
  )
}

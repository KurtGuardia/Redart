import Link from 'next/link'
import HeroBackgroundSlider from '../components/HeroBackgroundSlider'
import MapView from '../components/map/MapView'
import FeaturedEventsList from '../components/event/FeaturedEventsList'
import Spots from '../components/ui/Spot'

export default function HomePage() {
  const heroImages = [
    '/theater.jpg',
    '/carnival.jpg',
    '/guitarist.jpg',
  ]

  return (
    <>
      <div className='absolute top-0 left-0 right-0 opacity-80 bg-gradient-to-r from-[var(--secondary-color)] to-[var(--primary)] h-[80vh]' />
      <HeroBackgroundSlider images={heroImages}>
        <div className='mx-auto z-10 text-center flex flex-col justify-between align-center bg-white bg-opacity-25 rounded-3xl py-8'>
          <h1 className='text-3xl xl:text-5xl text-[var(--white)] md:text-4xl font-bold xl:w-[90%] w-[70%] mx-auto animate-fade-in-up'>
            Descubre la vibrante escena artística de Bolivia
          </h1>
          <p className='font-semibold text-xl xl:text-3xl max-w-2xl mx-auto mb-8 animate-fade-in-up'>
            Encuentra eventos, espacios y artistas en tu
            ciudad
          </p>
          <Link
            href='/events'
            className='bg-[var(--white)] text-[var(--blue-500)] px-8 py-3 rounded-xl shadow-md text-xl xl:text-2xl font-semibold hover:bg-[#7928ca] hover:text-[var(--secondary-color)] transition duration-300 animate-fade-in-up w-fit mx-auto'
          >
            Explorar eventos
          </Link>
        </div>
      </HeroBackgroundSlider>

      <FeaturedEventsList />

      <section
        className='about-us img relative mt-24'
        style={{ backgroundImage: `url(${'/crowd.jpg'})` }}
      >
        <div className='w-[80%] relative min-h-[50vh] flex flex-col z-10 py-12 mx-auto px-4 text-center text-white'>
          <h2 className='text-3xl xl:text-5xl font-bold mb-12'>
            Sobre nosotros
          </h2>
          <p className='flex-1 text-lg xl:text-2xl  font-semibold mx-auto mb-14 leading-relaxed px-8 text-center'>
            Radart conecta artistas, espacios y amantes del
            arte en Bolivia. Nuestra misión es visibilizar
            la cultura y crear una comunidad que celebre la
            creatividad. Únete a nosotros y construyamos
            juntos este movimiento.
          </p>
          <div className='text-center'>
            <Link
              href='/faq'
              className='text-[var(--secondary-color-foreground)] rounded-full text-sm xl:text-xl font-semibold bg-[var(--white)] px-8 py-3 shadow-md hover:bg-[#7928ca] hover:text-[var(--secondary-color)] transition duration-300 animate-fade-in-up w-fit mx-auto'
            >
              Preguntas frecuentes
            </Link>
          </div>
        </div>
        <div className='w-full absolute top-0 left-0 bg-[var(--teal-700)] opacity-70 h-full' />
      </section>

      <section className='map mt-24'>
        <div className='relative container mx-auto px-4 w-[80%] 2xl:w-[100%]'>
          <Spots count={4} />
          <h2 className='text-3xl xl:text-5xl font-bold text-center mb-8 bg-gradient-to-r from-[var(--blue-600)] to-[var(--blue-900)] bg-clip-text text-transparent px-6 py-3 rounded-lg'>
            Explora los espacios culturales
          </h2>
          <p className='text-center text-md xl:text-2xl font-light mb-12'>
            En Radart te damos la oportunidad de explorar
            los espacios culturales de Bolivia. Encuentra el
            tuyo preferido y conoce la programación de
            eventos.
          </p>
          <MapView hideSearch={true} />
        </div>
      </section>

      <section className='join text-center container mx-auto mb-48 mt-24'>
        <h2 className='text-3xl xl:text-5xl font-bold text-center mb-8 bg-gradient-to-r from-[var(--blue-600)] to-[var(--blue-900)] bg-clip-text text-transparent px-6 py-3 rounded-lg transform-gpu hover:scale-105 transition-transform'>
          ¿Quieres unirte a la comunidad de Radart?
        </h2>
        <p className='text-center text-md xl:text-2xl font-semibold max-w-2xl mx-auto mb-8 animate-fade-in-up'>
          ¡Únete a la movida cultural y muestra tus
          actividades!
          <br /> ¿Eres un espacio artistico? Crea tu cuenta
          y conecta con tu potencial audiencia mostrando tus
          eventos.
        </p>
        <Link
          href='/register'
          className='bg-[var(--secondary-color)] text-[var(--secondary-color-foreground)] px-6 py-2 rounded-full hover:bg-[#7928ca] hover:text-[var(--white)] transition duration-300 text-sm font-semibold shadow-md mx-auto'
        >
          Crear cuenta
        </Link>
      </section>
    </>
  )
}

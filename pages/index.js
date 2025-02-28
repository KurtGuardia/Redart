import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import Link from 'next/link'
import Image from 'next/image'
import TypingAnimation from '../components/TypingAnimation'
import Spot from '../components/Spot'

export default function Home () {
  const [bgIndex, setBgIndex] = useState( 0 )
  const images = ['/theater.jpg', '/carnival.jpg', '/guitarist.jpg']

  useEffect( () => {
    const interval = setInterval( () => {
      setBgIndex( ( prev ) => ( prev + 1 ) % images.length )
    }, 2000 )

    return () => clearInterval( interval )
  }, [] )

  return (
    <Layout>
      <div
        className='absolute top-0 left-0 right-0 opacity-80 bg-gradient-to-r from-[var(--accent)] to-[var(--primary)] h-[80vh]'
      />
      <section className='hero img text-white h-[80vh] flex items-center'
        style={{ backgroundImage: `url(${images[bgIndex]})` }}>
        <div className='container mx-auto px-4 z-10 text-center flex flex-col justify-between gap-4 bg-white bg-opacity-25 rounded-3xl py-10'>
          <h1 className='text-4xl md:text-6xl font-bold mb-4 animate-fade-in-up'>
            Descubre la vibrante escena artística de Bolivia
          </h1>
          <p className='font-semibold text-2xl max-w-2xl mx-auto mb-8 animate-fade-in-up'>
            Encuentra eventos, espacios y artistas en tu ciudad
          </p>
          <Link
            href='/events'
            className='bg-[var(--color-white)] text-[var(--color-blue-500)] px-8 py-3 rounded-xl shadow-md text-lg font-semibold hover:bg-[#7928ca] hover:text-[var(--accent)] transition duration-300 animate-fade-in-up w-fit mx-auto'
          >
            Explorar eventos
          </Link>
        </div>
      </section>

      <section className='intro relative py-16 my-16'>
        <Spot colorName={'red'} />
        <Spot colorName={'indigo'} />
        <Spot colorName={'peru'} />

        <div className='container mx-auto px-4 text-center min-h-[250px] flex items-center justify-center bg-[rgba(255,255,255,0.5)] rounded-3xl'>
          <TypingAnimation text='¡¡Estamos dando vida a una herramienta para impulsar la cultura! Ya estamos registrando espacios en todo el país. Si tu espacio acoge obras, conciertos, exposiciones o cualquier expresión artística, y está abierto al público, crea tu cuenta y sé parte de esta red cultural en crecimiento.' />
        </div>
      </section>

      <section className='featured-events py-16 my-24'>
        <div className='relative container mx-auto px-4'>
          <Spot colorName={'FireBrick'} />
          <Spot colorName={'Magenta'} />
          <Spot colorName={'Peru'} />
          <h2 className='text-3xl font-bold text-center mb-8 bg-gradient-to-r from-[var(--color-blue-600)] to-[var(--color-blue-900)] bg-clip-text text-transparent px-6 py-3 rounded-lg backface-visibility-hidden transform-gpu hover:scale-105 transition-transform'>
            Eventos destacados
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-14 justify-items-center'>
            {[1, 2, 3].map( ( event ) => (
              <div
                key={event}
                className='bg-[var(--color-white)] rounded-lg shadow-md overflow-hidden max-w-xs'
              >
                <Image
                  src={`/placeholder.svg?height=200&width=400`}
                  alt='Event poster'
                  width={400}
                  height={200}
                  className='w-full h-48 object-cover'
                />
                <div className='p-4'>
                  <h3 className='text-xl font-semibold mb-2'>
                    Concierto Nocturno
                  </h3>
                  <p className='text-[var(--color-gray-600)] mb-2'>
                    Una noche de música en vivo con artistas
                    locales...
                  </p>
                  <div className='flex justify-between text-sm text-[var(--accent-foreground)]'>
                    <span>25 Feb 2025</span>
                    <span>La Paz</span>
                    <span>Bs 50</span>
                  </div>
                </div>
              </div>
            ) )}
          </div>
          <div className='text-center'>
            <Link
              href='/events'
              className='bg-[var(--accent)] text-[var(--accent-foreground)] hover:text-white px-6 py-2 rounded-full text-lg font-semibold hover:bg-teal-700 hover:text-[var(--color-white)] transition duration-300'
            >
              Ver todos los eventos
            </Link>
          </div>
        </div>
      </section>

      <section className='about-us img relative my-24' style={{ backgroundImage: `url(${'/crowd.jpg'})` }}>

        <div className='relative z-10 py-28 mx-auto px-4 text-center text-white h-[500px]'>
          <h2 className='text-5xl font-bold mb-12'>
            Sobre nosotros
          </h2>
          <p className='text-2xl font-semibold max-w-5xl mx-auto mb-14 leading-relaxed px-8 text-center'>
            Radarte conecta artistas, espacios y amantes del
            arte en Bolivia. Nuestra misión es visibilizar
            la cultura y crear una comunidad que celebre la
            creatividad. Únete a nosotros y construyamos
            juntos este movimiento.
          </p>
          <div className='text-center'>
            <Link
              href='/faq'
              className='bg-[var(--accent)] text-[var(--accent-foreground)] px-6 py-2 rounded-full text-lg font-semibold hover:bg-white hover:text-[var(--color-blue-500)] transition duration-300'
            >
              Preguntas frecuentes
            </Link>
          </div>
        </div>
        <div className='w-full absolute top-0 left-0 bg-[var(--color-teal-700)] opacity-70  h-[500px]' />
      </section>

      <section className='map py-16 my-24'>
        <div className='relative container mx-auto px-4'>
          <Spot colorName={'OliveDrab'} />
          <Spot colorName={'Teal'} />
          <Spot colorName={'Chartreuse'} />
          <Spot colorName={'Coral'} />
          <h2 className='text-3xl font-bold text-center mb-8 bg-gradient-to-r from-[var(--color-blue-600)] to-[var(--color-blue-900)] bg-clip-text text-transparent px-6 py-3 rounded-lg backface-visibility-hidden transform-gpu hover:scale-105 transition-transform'>
            Explora los espacios culturales
          </h2>
          <div className='aspect-w-16 aspect-h-9 mb-14'>
            <iframe
              width='70%'
              height='400px'
              style={{ margin: 'auto', display: 'block' }}
              src='https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3820.123456789012!2d-66.156123!3d-17.389499!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTfCsDIzJzIyLjIiUyA2NsKwMDknMjIuMCJX!5e0!3m2!1sen!2sbo!4v1234567890123!5m2!1sen!2sbo'
              allowfullscreen
              loading='lazy'
            >
            </iframe>
          </div>
        </div>
      </section>

      <div className='text-center mb-24'>
        <p className='text-center text-xl text-[var(--color-blue-900)] font-semibold max-w-2xl mx-auto mb-8 animate-fade-in-up'>¡Únete a la movida cultural y muestra tus actividades!<br /> ¿Eres un espacio artistico? Crea tu cuenta y conecta con tu potencial audiencia mostrando tus eventos.</p>
        <Link
          href='/register'
          className='bg-[var(--accent)] text-[var(--accent-foreground)] hover:text-white px-6 py-2 rounded-full text-lg font-semibold hover:bg-teal-700 transition duration-300'
        >
          Crear cuenta
        </Link>
      </div>
    </Layout>
  )
}

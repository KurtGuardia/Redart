import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import Link from 'next/link'
import TypingAnimation from '../components/TypingAnimation'
import Spot from '../components/Spot'
import EventCard from '../components/EventCard'
import MapComponent from '../components/MapComponent'

export default function Home() {
  const [bgIndex, setBgIndex] = useState(0)
  const images = [
    '/theater.jpg',
    '/carnival.jpg',
    '/guitarist.jpg',
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % images.length)
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  const featuredEvents = [
    {
      id: 1,
      title: 'Concierto Nocturno',
      description:
        'Una noche de música en vivo con artistas locales, donde podrás disfrutar de una gran variedad de estilos y ritmos. La noche estará llena de energía y pasión, con performances en vivo que te dejarán sin aliento.',
      date: '3 Mar 2025',
      location: 'Cochabamba',
      image: '/placeholder.svg?height=200&width=400',
      type: 'primary',
    },
    {
      id: 2,
      title: 'Musica en Vivo',
      description:
        'Una noche de música en vivo con artistas locales...',
      date: '25 Feb 2025',
      location: 'La Paz',
      image: '/placeholder.svg?height=200&width=400',
      type: 'secondary-color',
    },
    {
      id: 3,
      title: 'Festival de Jazz',
      description:
        'Una noche de música en vivo con artistas locales...',
      date: '24 Sept 2025',
      location: 'Sta. Cruz',
      image: '/placeholder.svg?height=200&width=400',
      type: 'destructive',
    },
  ]

  return (
    <Layout>
      <div className='absolute top-0 left-0 right-0 opacity-80 bg-gradient-to-r from-[var(--secondary-color)] to-[var(--primary)] h-[80vh]' />
      <section
        className='hero img text-white h-[80vh] flex items-center w-full'
        style={{
          backgroundImage: `url(${images[bgIndex]})`,
        }}
      >
        <div className='container mx-auto px-4 z-10 text-center flex flex-col justify-between gap-4 bg-white bg-opacity-25 rounded-3xl py-10'>
          <h1 className='text-4xl md:text-6xl font-bold md:leading-[150%] mb-4 animate-fade-in-up '>
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
      </section>

      <section className='intro relative py-16 my-16'>
        <Spot colorName={'red'} />
        <Spot colorName={'indigo'} />
        <Spot colorName={'peru'} />

        <div className='container mx-auto px-4 text-center min-h-[250px] flex items-center justify-center bg-[rgba(255,255,255,0.5)] rounded-3xl'>
          <TypingAnimation text='¡Estamos dando vida a una herramienta para impulsar la cultura! Ya estamos registrando espacios en todo el país. Si tu espacio acoge obras, conciertos, exposiciones o cualquier expresión artística, y está  abierto al público, crea tu cuenta y sé parte de esta red cultural en crecimiento.' />
        </div>
      </section>

      <section className='featured-events py-16 my-24'>
        <div className='relative mx-auto px-4'>
          <Spot colorName={'FireBrick'} />
          <Spot colorName={'Magenta'} />
          <Spot colorName={'Peru'} />
          <h2 className='text-3xl font-bold text-center mb-8 bg-gradient-to-r from-[var(--blue-600)] to-[var(--blue-900)] bg-clip-text text-transparent px-6 py-3 rounded-lg backface-visibility-hidden transform-gpu hover:scale-105 transition-transform'>
            Eventos destacados
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-14 justify-items-center'>
            {featuredEvents.map((event) => (
              <EventCard
                key={event.id}
                title={event.title}
                description={event.description}
                date={event.date}
                location={event.location}
                image={event.image}
                type={event.type}
              />
            ))}
          </div>
          <div className='text-center'>
            <Link
              href='/events'
              className='bg-[var(--secondary-color)] text-[var(--secondary-color-foreground)] hover:text-white px-6 py-2 rounded-full text-lg font-semibold hover:bg-teal-700 hover:text-[var(--white)] transition duration-300'
            >
              Ver todos los eventos
            </Link>
          </div>
        </div>
      </section>

      <section
        className='about-us img relative my-24'
        style={{ backgroundImage: `url(${'/crowd.jpg'})` }}
      >
        <div className='relative z-10 py-28 mx-auto px-4 text-center text-white h-[500px]'>
          <h2 className='text-5xl font-bold mb-12'>
            Sobre nosotros
          </h2>
          <p className='text-2xl font-semibold mx-auto mb-14 leading-relaxed px-8 text-center'>
            Radarte conecta artistas, espacios y amantes del
            arte en Bolivia. Nuestra misión es visibilizar
            la cultura y crear una comunidad que celebre la
            creatividad. Únete a nosotros y construyamos
            juntos este movimiento.
          </p>
          <div className='text-center'>
            <Link
              href='/faq'
              className='bg-[var(--secondary-color)] text-[var(--secondary-color-foreground)] px-6 py-2 rounded-full text-lg font-semibold hover:bg-white hover:text-[var(--blue-500)] transition duration-300'
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
          <h2 className='text-3xl font-bold text-center mb-8 bg-gradient-to-r from-[var(--blue-600)] to-[var(--blue-900)] bg-clip-text text-transparent px-6 py-3 rounded-lg backface-visibility-hidden transform-gpu hover:scale-105 transition-transform'>
            Explora los espacios culturales
          </h2>
          <p className='text-center text-xl font-light mb-12'>
            En Radarte te damos la oportunidad de explorar
            los espacios culturales de Bolivia. Encuentra el
            tuyo preferido y conoce la programación de
            eventos.
          </p>
          <div className='w-[70%] h-[60vh] mx-auto'>
            <MapComponent
              center={[-17.389499, -66.156123]}
            />
          </div>
        </div>
      </section>

      <section className='join text-center container mx-auto mb-48'>
        <h2 className='text-3xl font-bold text-center mb-8 bg-gradient-to-r from-[var(--blue-600)] to-[var(--blue-900)] bg-clip-text text-transparent px-6 py-3 rounded-lg backface-visibility-hidden transform-gpu hover:scale-105 transition-transform'>
          ¿Quieres unirte a la comunidad de Radarte?
        </h2>
        <p className='text-center text-xl text-[var(--blue-900)] font-semibold max-w-2xl mx-auto mb-8 animate-fade-in-up'>
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
    </Layout>
  )
}

import Layout from '../components/Layout'
import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  return (
    <Layout>
      <section className='hero bg-gradient-to-r from-[var(--color-teal-500)] to-[var(--color-blue-500)] text-white h-[80vh] flex items-center'>
        <div className='container mx-auto px-4 text-center flex flex-col justify-between gap-4'>
          <h1 className='text-4xl md:text-6xl font-bold mb-4 animate-fade-in-up'>
            Descubre la vibrante escena artística de Bolivia
            con Radarte
          </h1>
          <p className='text-xl md:text-2xl mb-8 animate-fade-in-up'>
            Tu puerta de entrada a espacios culturales y
            eventos artísticos
          </p>
          <Link
            href='/events'
            className='bg-[var(--color-white)] text-[var(--color-teal-500)] px-8 py-3 rounded-xl shadow-md text-lg font-semibold hover:bg-[#7928ca80] transition duration-300 animate-fade-in-up w-fit mx-auto'
          >
            Explorar eventos
          </Link>
        </div>
      </section>

      <section className='intro py-16'>
        <div className='container mx-auto px-4 text-center'>
          <p className='text-lg text-[var(--color-gray-700)] max-w-3xl mx-auto'>
            ¡Estamos dando vida a una herramienta para
            impulsar la cultura! Ya estamos registrando
            espacios en todo el país. Si tu espacio acoge
            obras, conciertos, exposiciones o cualquier
            expresión artística, y está abierto al público,
            crea tu cuenta y sé parte de esta red cultural
            en crecimiento.
          </p>
        </div>
      </section>

      <section className='featured-events py-16'>
        <div className='container mx-auto px-4'>
          <h2 className='text-3xl font-bold text-center mb-8'>
            Eventos destacados
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
            {[1, 2, 3].map((event) => (
              <div
                key={event}
                className='bg-[var(--color-white)] rounded-lg shadow-md overflow-hidden'
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
                  <div className='flex justify-between text-sm text-[var(--color-gray-500)]'>
                    <span>25 Feb 2025</span>
                    <span>La Paz</span>
                    <span>Bs 50</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className='text-center mt-8'>
            <Link
              href='/campaigns'
              className='bg-[var(--color-teal-500)] text-[var(--color-white)] px-6 py-2 rounded-full text-lg font-semibold hover:bg-teal-700 transition duration-300'
            >
              Ver todas las campañas
            </Link>
          </div>
        </div>
      </section>

      <section className='about-us py-16'>
        <div className='container mx-auto px-4 text-center'>
          <h2 className='text-3xl font-bold mb-4'>
            Sobre nosotros
          </h2>
          <p className='text-lg text-[var(--color-gray-700)] max-w-3xl mx-auto mb-8 leading-relaxed px-8 text-center'>
            Radarte conecta artistas, espacios y amantes del
            arte en Bolivia. Nuestra misión es visibilizar
            la cultura y crear una comunidad que celebre la
            creatividad. Únete a nosotros y construyamos
            juntos este movimiento.
          </p>
          <Link
            href='/faq'
            className='bg-[var(--color-teal-500)] text-[var(--color-white)] px-6 py-2 rounded-full text-lg font-semibold hover:bg-teal-700 transition duration-300'
          >
            Preguntas frecuentes
          </Link>
        </div>
      </section>

      <section className='map py-16'>
        <div className='container mx-auto px-4'>
          <h2 className='text-3xl font-bold text-center mb-8'>
            Explora los espacios culturales
          </h2>
          <div className='aspect-w-16 aspect-h-9 mb-8'>
            <div className='w-full h-full flex items-center justify-center text-[var(--color-gray-600)]'>
              Mapa interactivo aquí
            </div>
          </div>
          <div className='text-center'>
            <Link
              href='/register'
              className='bg-[var(--color-teal-500)] text-[var(--color-white)] px-6 py-2 rounded-full text-lg font-semibold hover:bg-teal-700 transition duration-300'
            >
              Crear cuenta
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  )
}

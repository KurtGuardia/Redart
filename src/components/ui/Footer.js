'use client'

import Link from 'next/link'
import {
  FaWhatsapp,
  FaFacebook,
  FaInstagram,
  FaTwitter,
  FaEnvelope,
} from 'react-icons/fa'

const Footer = () => (
  <footer className='bg-[var(--blue-800)] py-10 xl:py-5 px-24 xl:px-9'>
    <div className='max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8'>
      {/* Contact Section */}
      <div className='flex flex-col items-center md:items-start space-y-4'>
        <h3 className='underline underline-offset-4 text-white text-lg font-semibold mb-2'>
          Contacto
        </h3>
        <a
          href='mailto:info@radart.com?subject=Consulta%20sobre%20Radart&body=Hola%20equipo%20Radart%2C%0A%0AMe%20gustar%C3%ADa%20obtener%20m%C3%A1s%20informaci%C3%B3n%20sobre...'
          className='flex items-center gap-2 text-white hover:text-[var(--secondary-color)] transition-colors'
          target='_blank'
          rel='noopener noreferrer'
        >
          <FaEnvelope className='text-xl' />
          info@Radart.com
        </a>
        <a
          href='https://wa.me/5911234567?text=Hola%20Radart%2C%20me%20gustar%C3%ADa%20obtener%20m%C3%A1s%20informaci%C3%B3n%20sobre...'
          className='flex items-center gap-2 text-white hover:text-[var(--secondary-color)] transition-colors'
          target='_blank'
          rel='noopener noreferrer'
        >
          <FaWhatsapp className='text-xl text-[var(--whatsapp)]' />
          +591 123 4567
        </a>
        <div className='flex space-x-4'>
          <a
            href='https://www.facebook.com/Radart-105795649568595'
            className='text-[var(--facebook)] hover:text-[var(--primary)] transition-all duration-300'
            aria-label='Facebook'
          >
            <FaFacebook className='h-6 w-6' />
          </a>
          <a
            href='https://www.instagram.com/Radart/'
            className='text-[var(--instagram)] hover:text-[var(--primary)] transition-all duration-300'
            aria-label='Instagram'
          >
            <FaInstagram className='h-6 w-6' />
          </a>
          <a
            href='https://twitter.com/Radart'
            className='text-[var(--twitter)] hover:text-[var(--primary)] transition-all duration-300'
            aria-label='Twitter'
          >
            <FaTwitter className='h-6 w-6' />
          </a>
        </div>
      </div>

      {/* Logo Section */}
      <div className='flex flex-col items-center'>
        <div className='w-32 h-32 bg-white/20 rounded-full mb-4 flex items-center justify-center'>
          <span className='text-white text-2xl font-bold'>
            Radart
          </span>
        </div>
        <p className='text-white text-sm text-center'>
          Conectando la cultura y el arte en Bolivia
        </p>
      </div>

      {/* Links Section */}
      <div className='flex flex-col items-center md:items-end space-y-4'>
        <h3 className='underline underline-offset-4 text-white text-lg font-semibold mb-2'>
          Enlaces Rápidos
        </h3>
        <Link
          href='/about'
          className='text-white hover:text-[var(--secondary-color)] transition-colors'
        >
          Sobre Nosotros
        </Link>
        <Link
          href='/events'
          className='text-white hover:text-[var(--secondary-color)] transition-colors'
        >
          Eventos
        </Link>
        <Link
          href='/map'
          className='text-white hover:text-[var(--secondary-color)] transition-colors'
        >
          Locaciones
        </Link>
      </div>
    </div>

    {/* Copyright Section */}
    <div className='mt-8 border-t border-white/20 pt-6 text-center'>
      <p className='text-white'>
        &copy; {new Date().getFullYear()} Radart - Todos los
        derechos reservados.
      </p>
    </div>
  </footer>
)

export default Footer

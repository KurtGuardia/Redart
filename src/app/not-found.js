'use client'

import Link from 'next/link'
import Spot from '../components/ui/Spot'
import { FaQuestionCircle } from 'react-icons/fa'

export default function NotFound() {
  return (
    <div className='min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden'>
      {/* Decorative Spots */}
      <div className='fixed inset-0 pointer-events-none overflow-hidden opacity-40'>
        <Spot
          colorName='purple'
          customClass='top-10 -left-60 opacity-70 blur-xl'
        />
        <Spot
          colorName='teal'
          customClass='bottom-10 -right-60 opacity-70 blur-xl'
        />
        <Spot
          colorName='blue' // Added another spot for balance
          customClass='top-1/3 right-1/4 opacity-50 blur-2xl'
        />
      </div>

      {/* Content Area */}
      <div className='relative z-10 text-center p-8 max-w-lg w-full'>
        {/* Large 404 Text */}
        <h1 className='text-7xl md:text-8xl font-extrabold mb-4'>
          <span className='bg-gradient-to-r from-teal-500 via-blue-500 to-purple-600 text-transparent bg-clip-text'>
            404
          </span>
        </h1>

        {/* Main Message */}
        <h2 className='text-lg md:text-2xl font-bold text-gray-800 mb-3'>
          Página No Encontrada
        </h2>

        {/* Sub Message */}
        <p className='text-lg md:text-lg text-gray-600 mb-8'>
          ¡Ups! Parece que la página que buscas se perdió en
          el universo digital.
        </p>

        {/* Replace SVG with React Icon */}
        <div className='mb-8 text-teal-500 opacity-80 flex justify-center'>
          <FaQuestionCircle className='w-24 h-24' />
        </div>

        {/* Action Button */}
        <Link
          href='/'
          className='inline-block px-8 py-3 bg-gradient-to-r from-teal-500 to-blue-500 text-white font-semibold rounded-lg shadow-md hover:opacity-90 transition-opacity duration-300'
        >
          Volver al Inicio
        </Link>
      </div>
    </div>
  )
}

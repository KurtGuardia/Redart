'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Spots from '../components/ui/Spots'

export default function Error({ error, reset }) {
  const [timeLeft, setTimeLeft] = useState(10)
  const [showDetails, setShowDetails] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })

  // Countdown timer for automatic retry/redirect
  useEffect(() => {
    if (timeLeft <= 0) {
      reset()
      return
    }

    const timer = setTimeout(() => {
      setTimeLeft((prev) => prev - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [timeLeft, reset])

  // Easter egg animation
  useEffect(() => {
    const handleMouseMove = (e) => {
      setPosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () =>
      window.removeEventListener(
        'mousemove',
        handleMouseMove,
      )
  }, [])

  useEffect(() => {
    console.error('An error occurred:', error.message, {
      stack: error.stack,
    })
  }, [error])

  return (
    <div className='min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden'>
      <Spots count={5} />
      {/* Follow cursor spotlight effect */}
      <div
        className='fixed w-96 h-96 rounded-full bg-teal-100/30 blur-3xl pointer-events-none transition-all duration-500 ease-out'
        style={{
          left: `${position.x - 192}px`,
          top: `${position.y - 192}px`,
          opacity: position.x ? 0.5 : 0,
        }}
      ></div>

      {/* Error card */}
      <div
        className={`relative z-10 bg-white rounded-2xl shadow-xl overflow-hidden max-w-md w-full transition-transform`}
      >
        {/* Decorative header */}
        <div className='h-3 bg-gradient-to-r from-teal-500 to-blue-500'></div>

        {/* Error content */}
        <div className='p-8'>
          {/* Error icon */}
          <div className='w-24 h-24 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6'>
            <div className='relative'>
              <div className='w-12 h-12 rounded-full border-4 border-red-500 flex items-center justify-center animate-pulse'>
                <span className='text-red-500 text-2xl font-bold'>
                  !
                </span>
              </div>
              <div className='absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-bounce'></div>
            </div>
          </div>

          <h1 className='text-2xl font-bold text-gray-800 text-center mb-2'>
            Oops! Ha ocurrido un error
          </h1>
          <p className='text-gray-600 text-center mb-6'>
            Algo salió mal. Estamos trabajando para
            solucionarlo.
          </p>

          {/* Countdown timer */}
          <div className='text-center mb-6'>
            <div className='inline-block px-3 py-1 rounded-full bg-teal-50 text-teal-600 font-medium'>
              Reintentando en {timeLeft} segundos
            </div>
          </div>

          {/* Actions */}
          <div className='flex flex-col gap-3'>
            <button
              onClick={reset}
              className='px-4 py-3 bg-gradient-to-r from-teal-500 to-blue-500 text-white font-medium rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center'
            >
              <svg
                className='w-5 h-5 mr-2'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
                />
              </svg>
              Reintentar ahora
            </button>

            <Link
              href='/'
              className='px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-center'
            >
              Volver al inicio
            </Link>
          </div>

          {/* Error details (expandable) */}
          {error && (
            <div className='mt-6'>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className='text-sm text-gray-500 hover:text-teal-600 flex items-center mx-auto'
              >
                {showDetails
                  ? 'Ocultar detalles'
                  : 'Mostrar detalles'}
                <svg
                  className={`w-4 h-4 ml-1 transition-transform ${
                    showDetails ? 'rotate-180' : ''
                  }`}
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M19 9l-7 7-7-7'
                  />
                </svg>
              </button>

              {showDetails && (
                <div className='mt-2 p-3 bg-gray-50 rounded-lg text-sm text-gray-600 font-mono overflow-auto max-h-32'>
                  {error.message || 'Error desconocido'}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating Icon (was Easter egg) - now always shown */}
      <div
        className='fixed w-20 h-20 transition-all duration-300 ease-out pointer-events-none z-20'
        style={{
          left: `${position.x - 40}px`,
          top: `${position.y - 40}px`,
          transform: 'translate(-100px, -100px)',
          opacity: 0.9,
        }}
      >
        <div className='relative w-full h-full'>
          <div className='absolute inset-0 bg-yellow-400 rounded-full animate-pulse opacity-30'></div>
          <div className='absolute inset-2 bg-yellow-300 rounded-full flex items-center justify-center'>
            <span className='text-2xl'>🔧</span>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'

export default function Loading () {
  const [progress, setProgress] = useState( 0 )

  useEffect( () => {

    const timer = setInterval( () => {
      setProgress( ( prev ) => {
        if ( prev >= 100 ) {
          clearInterval( timer )
          return 100
        }
        return prev + 1
      } )
    }, 50 )

    return () => clearInterval( timer )
  }, [] )

  return (
    <div className='fixed inset-0 flex flex-col items-center justify-center bg-black/10 backdrop-blur-md z-[9999]'>

      {/* Main loading animation */}
      <div className='relative flex flex-col items-center'>
        {/* Pulsing circle */}
        <div className='absolute inset-0 flex items-center justify-center'>
          <div
            className='absolute rounded-full bg-gradient-to-r from-teal-500 to-blue-500 opacity-70 animate-ping'
            style={{ width: '150px', height: '150px' }}
          ></div>
        </div>

        {/* Spinning circle */}
        <div className='relative m-auto w-40 h-40 mb-8'>
          <div className='absolute inset-0 rounded-full border-8 border-transparent border-t-teal-500 border-b-blue-500 animate-spin'></div>
          <div
            className='absolute inset-2 rounded-full border-8 border-transparent border-r-teal-300 border-l-blue-300 animate-spin'
            style={{
              animationDirection: 'reverse',
              animationDuration: '1.5s',
            }}
          ></div>

          {/* Center emblem */}
          <div className='absolute inset-0 flex items-center justify-center'>
            <div className='bg-white rounded-full w-20 h-20 flex items-center justify-center shadow-lg shadow-teal-500/20'>
              <span className='text-3xl font-bold bg-gradient-to-r from-teal-500 to-blue-500 text-transparent bg-clip-text'>
                R
              </span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className='w-64 h-2 bg-gray-200 rounded-full overflow-hidden mt-4'>
          <div
            className='h-full bg-gradient-to-r from-teal-500 to-blue-500 transition-all duration-100 ease-in-out'
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* Loading text animation */}
        <div className='text-center text-xl mt-4 font-bold text-[var(--teal-500)] inline-flex items-baseline'>
          <span>Cargando</span>
          <span className='ml-1 flex space-x-1'>
            <span
              className='inline-block w-2 h-2 bg-teal-500 rounded-full animate-bounce'
              style={{ animationDelay: '0ms' }}
            ></span>
            <span
              className='inline-block w-2 h-2 bg-teal-500 rounded-full animate-bounce'
              style={{ animationDelay: '150ms' }}
            ></span>
            <span
              className='inline-block w-2 h-2 bg-teal-500 rounded-full animate-bounce'
              style={{ animationDelay: '300ms' }}
            ></span>
          </span>
        </div>
      </div>

      {/* Animated phrases */}
      <div className='mt-12 text-center max-w-md bg-black/10 rounded-xl p-4 text-[var(--accent)] italic opacity-80'>
        <p
          className='animate-blink'
          style={{ animationDelay: '1s' }}
        >
          Creando experiencias inolvidables
        </p>
      </div>
    </div>
  )
}

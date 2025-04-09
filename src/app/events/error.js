'use client' // Error components must be Client Components

import { useEffect } from 'react'
import Link from 'next/link'

export default function EventsError({ error, reset }) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className='min-h-[60vh] flex flex-col justify-center items-center text-center px-4 py-10'>
      <h2 className='text-2xl font-bold text-red-600 mb-4'>
        ¡Ups! Algo salió mal al cargar los eventos.
      </h2>
      <p className='text-red-500 mb-6 max-w-md'>
        {error?.message || 'Ocurrió un error inesperado.'}
      </p>
      <div className='flex gap-4'>
        <button
          onClick={
            // Attempt to recover by trying to re-render the segment
            () => reset()
          }
          className='bg-teal-500 hover:bg-teal-600 text-white px-6 py-2 rounded-md transition-colors'
        >
          Intentar de nuevo
        </button>
        <Link
          href='/'
          className='text-teal-600 hover:text-teal-800 underline'
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}

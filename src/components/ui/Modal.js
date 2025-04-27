import React from 'react'

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
}) {
  if (!isOpen) return null
  return (
    <div className='fixed inset-0 z-[9999] flex items-center justify-center bg-black/40'>
      <div className='bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6 relative animate-fade-in'>
        <button
          onClick={onClose}
          className='absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none'
          aria-label='Cerrar'
        >
          &times;
        </button>
        {title && (
          <h2 className='text-2xl font-semibold mb-4 text-center text-teal-700'>
            {title}
          </h2>
        )}
        <div className='mb-4 text-gray-700 text-center'>
          {children}
        </div>
        <div className='flex justify-center mt-6'>
          <button
            onClick={onClose}
            className='px-6 py-2 bg-teal-600 text-white rounded-lg shadow hover:bg-teal-700 transition font-semibold'
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  )
}

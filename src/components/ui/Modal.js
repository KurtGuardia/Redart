import React, { useEffect } from 'react'

export default function Modal({
  isOpen,
  onClose,
  onReject,
  onAccept,
  title,
  children,
}) {
  // to escape with the Esc key
  useEffect(() => {
    if (!isOpen) return

    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEsc)
    return () =>
      document.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  if (!isOpen) return null
  return (
    <div className='fixed inset-0 z-[9999] flex items-center justify-center bg-black/60'>
      <div className='bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 p-2 xl:p-6 relative animate-fade-in'>
        <button
          onClick={onClose}
          className='absolute top-1 right-2 text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none'
          aria-label='Cerrar'
        >
          &times;
        </button>
        {title && (
          <h2 className='text-xl xl:text-2xl font-semibold mb-4 text-center text-teal-700'>
            {title}
          </h2>
        )}
        <div className='mb-4 text-base xl:text-lg text-gray-700'>
          {children}
        </div>
        <div className='flex gap-3 text-lg justify-center mt-6'>
          {onAccept && (
            <button
              onClick={onAccept}
              className='px-6 py-2 bg-teal-600 text-white rounded-lg shadow hover:bg-teal-700 transition font-semibold'
            >
              Aceptar
            </button>
          )}
          {onReject && (
            <button
              onClick={onReject}
              className='px-6 py-2 bg-red-600 text-white rounded-lg shadow hover:bg-red-700 transition font-semibold'
            >
              Rechazar
            </button>
          )}{' '}
        </div>
      </div>
    </div>
  )
}

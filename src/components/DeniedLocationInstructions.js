'use client'

import { MdLocationOff, MdRefresh } from 'react-icons/md'
import Modal from './ui/Modal'

export default function DeniedLocationInstructions({
  showPermissionModal,
  setShowPermissionModal,
  browser,
  instructions,
  userLocationError,
  eventOrLocationScreen,
}) {
  return (
    <div
      className={
        'text-lg xl:text-2xl mx-auto rounded-lg overflow-hidden flex flex-col justify-center items-center text-center h-auto xl:h-[60vh] bg-gray-100 p-4 w-full'
      }
    >
      <Modal
        isOpen={showPermissionModal}
        onClose={() => setShowPermissionModal(false)}
        onAccept={() => setShowPermissionModal(false)}
        title='Permiso de Ubicación Denegado'
      >
        Al negar el permiso, ahora debes habilitar
        manualmente la geolocalización en tu navegador.
        <br />
        <br />
        Pasos para habilitar ubicación en{' '}
        <span className='text-[var(--blue-700)]'>
          {browser}
        </span>
        :
        <ol className='mt-4 mb-2 text-left mx-auto space-y-2 list-decimal list-inside bg-white/80 rounded-lg p-2 xl:p-4 shadow-lg border-2'>
          {instructions.map((step, index) => (
            <li
              key={index}
              className='pl-2 text-gray-800 leading-normal'
            >
              {step}
            </li>
          ))}
        </ol>
      </Modal>

      <p className='text-[var(--blue-800)] font-medium mb-4 flex flex-col lg:flex-row items-center gap-2'>
        <span className='text-red-600 w-8 xl:w-12 h-8 xl:h-12'>
          <MdLocationOff className='w-8 xl:w-12 h-8 xl:h-12' />
        </span>
        {userLocationError ||
          'Necesitamos tu permiso de ubicación para mostrar sitios cercanos.'}{' '}
        <br />
        <br />
        Necesitamos tu ubicación para mostrarte los{' '}
        {`${
          eventOrLocationScreen === 'events'
            ? 'eventos'
            : 'lugares'
        }`}{' '}
        que tengas cerca.
      </p>
      <p className='text-[var(--blue-800)] mb-6 bg-[var(--secondary-color-transparent)] rounded-md px-4 py-2 shadow-sm animate-bounce mt-8 lg:mt-2'>
        No te preocupes,{' '}
        <span className='font-semibold border-b-2 xl:border-b-4 border-[var(--blue-500)]'>
          no guardamos esta información.
        </span>
      </p>
      <button
        onClick={() => setShowPermissionModal(true)}
        className='text-base xl:text-xl px-2 xl:px-6 py-2 rounded-md font-semibold shadow-md transition hover:bg-[var(--secondary-color,#00bfae)] hover:text-[var(--blue-800)] bg-[var(--blue-800)] text-white'
      >
        <span className='inline-flex items-center gap-2'>
          <span className='hidden lg:inline'>
            <MdRefresh />
          </span>
          Cómo reintentar detección
        </span>
      </button>
    </div>
  )
}

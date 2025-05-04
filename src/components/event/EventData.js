'use client'

import { useEffect, useState } from 'react'
import { useEventData } from '../../hooks/useEventData'
import {
  formatTimestamp,
  addToGoogleCalendar,
  hasEventPassed,
  getCurrencySymbol,
} from '../../lib/utils'
import Image from 'next/image'
import Link from 'next/link'
import { SiGooglecalendar } from 'react-icons/si'
import { FiEye } from 'react-icons/fi'
import { FaStar } from 'react-icons/fa'
import { useAuth } from '../../hooks/useAuth'
import StarRatingInput from '../ui/StarRatingInput'
import useRatingSystem from '../../hooks/useRatingSystem'

export default function EventData({ eventId }) {
  const { event, loading, error } = useEventData(eventId)
  const [localEvent, setLocalEvent] = useState(null)
  const { user, loadingAuth } = useAuth()
  const [status, setStatus] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalImageUrl, setModalImageUrl] = useState('')
  const [currentUserRole, setCurrentUserRole] =
    useState(null)

  const {
    userRating,
    isSubmittingRating,
    isDeletingRating,
    ratingError,
    ratingSuccess,
    deleteSuccess,
    handleRatingSubmit,
    handleDeleteRating,
    updateUserRating,
  } = useRatingSystem({
    targetId: eventId,
    targetType: 'event',
    targetName: localEvent?.title || 'Evento sin título',
    user,
    onUpdateTarget: setLocalEvent,
  })

  let averageRating = 0
  let ratingCount = 0
  if (
    localEvent?.ratings &&
    Array.isArray(localEvent.ratings)
  ) {
    const scores = localEvent.ratings
      .map((r) => r.score)
      .filter(
        (score) =>
          typeof score === 'number' &&
          score >= 1 &&
          score <= 5,
      )
    if (scores.length > 0) {
      const sum = scores.reduce(
        (acc, score) => acc + score,
        0,
      )
      averageRating = sum / scores.length
      ratingCount = scores.length
    }
  }

  useEffect(() => {
    // Initialize localEvent when event data is fetched
    if (event) {
      setLocalEvent(event)
    }
  }, [event]) // <-- Depend only on the fetched event

  useEffect(() => {
    // This effect now depends on localEvent
    if (localEvent) {
      document.title = `${
        localEvent.title || 'Evento'
      } | Radarte`
      const metaDesc = document.querySelector(
        'meta[name="description"]',
      )
      if (metaDesc)
        metaDesc.setAttribute(
          'content',
          localEvent.description?.substring(0, 160) ||
            'Detalles del evento.',
        )

      if (localEvent.status === 'cancelled') {
        setStatus({
          label: 'CANCELADO',
          cardBgClass: '!bg-red-500/60',
          labelBgClass: 'bg-red-800',
        })
      } else if (localEvent.status === 'suspended') {
        setStatus({
          label: 'SUSPENDIDO',
          cardBgClass: '!bg-yellow-500/60',
          labelBgClass: 'bg-yellow-500',
        })
      } else if (hasEventPassed(localEvent.date)) {
        setStatus({
          label: 'FINALIZADO',
          cardBgClass: '!bg-gray-500/60',
          labelBgClass: 'bg-gray-500',
        })
      }

      updateUserRating(localEvent)
    }
  }, [localEvent, user, updateUserRating]) // <-- Include updateUserRating in dependencies

  const isLoading = loading || loadingAuth

  if (isLoading) {
    return (
      <div className='text-center py-10'>
        <div className='animate-pulse space-y-4'>
          <div className='h-8 bg-gray-200 rounded w-3/4 mx-auto'></div>
          <div className='h-4 bg-gray-200 rounded w-1/2 mx-auto'></div>
          <div className='h-64 bg-gray-200 rounded w-full'></div>
          <div className='h-4 bg-gray-200 rounded w-3/4 mx-auto'></div>
          <div className='h-4 bg-gray-200 rounded w-2/3 mx-auto'></div>
        </div>
      </div>
    )
  }

  if (error) throw error

  if (!localEvent) {
    // <-- Check localEvent for rendering
    return (
      <div className='text-center py-10 text-gray-500'>
        <p>Evento no encontrado.</p>
      </div>
    )
  }

  const currencySymbol = getCurrencySymbol(
    localEvent.currency,
  )
  const priceDisplay =
    localEvent.price > 0
      ? `${currencySymbol} ${event.price}`
      : 'Gratis'

  const openImageModal = (imageUrl) => {
    if (imageUrl && imageUrl !== '/placeholder.svg') {
      setModalImageUrl(imageUrl)
      setIsModalOpen(true)
    }
  }

  const closeImageModal = () => {
    setIsModalOpen(false)
    setModalImageUrl('')
  }

  return (
    <>
      <div
        className={`relative p-10 xl:p-16 mt-12 lg:mt-12 mb-6 w-full overflow-hidden ${
          !localEvent.image
            ? 'bg-gradient-to-r from-[var(--blue-700)] to-[var(--secondary-color)]'
            : ''
        }`}
      >
        {localEvent.image && (
          <Image
            src={localEvent.image}
            alt=''
            fill
            className='absolute inset-0 object-cover filter blur-lg scale-110 z-0'
            aria-hidden='true'
          />
        )}
        <div className='relative w-fit mx-auto z-20 bg-white/10 backdrop-blur-md rounded-lg px-4 py-1 md:p-6 xl:px-14 2xl:px-20 shadow-lg'>
          <h1 className='text-2xl md:text-3xl 2xl:text-5xl font-bold text-white'>
            {event.title || 'Evento sin título'}
          </h1>
        </div>
        <div className='absolute inset-0 bg-gradient-to-t from-black/100 via-black/50 to-transparent z-10'></div>
      </div>

      {localEvent.description && (
        <p className='mb-12 md:mb-16 border-b border-gray-200/80 rounded-xl bg-[var(--blue-800-transparent)] p-4 2xl:py-10 2xl:px-18 xl:max-w-[80%] mx-2 md:mx-8 xl:mx-auto whitespace-pre-wrap 2xl:leading-normal text-lg 2xl:text-2xl text-center text-white'>
          {localEvent.description || 'Sin descripción.'}
        </p>
      )}

      {status?.label && (
        <div
          className={`mx-auto my-10 block w-fit ${status.labelBgClass} px-4 lg:px-10 py-1 lg:py-4 text-center font-bold text-lg 2xl:text-xl tracking-widest shadow-lg whitespace-nowrap rounded-md text-white`}
        >
          {status.label}
        </div>
      )}

      {ratingCount > 0 && (
        <div className='flex items-center justify-center gap-2 text-3xl xl:text-5xl text-yellow-400 mb-6'>
          <span className='font-bold'>
            {averageRating.toFixed(1)}
          </span>
          <FaStar />
          <span className='text-base xl:text-xl text-gray-600 dark:text-gray-400 mt-1'>
            ({ratingCount}{' '}
            {ratingCount === 1 ? 'opinión' : 'opiniones'})
          </span>
        </div>
      )}

      <div
        className={`min-w-[70%] 2xl:max-w-[80%] flex flex-col lg:flex-row gap-8 lg:gap-12 p-4 lg:p-8 xl:p-14 mb-10 md:mb-12 mx-auto bg-white rounded-xl shadow-lg ${status?.cardBgClass}`}
      >
        <div className='lg:w-1/2 flex flex-col'>
          <h2 className='text-xl lg:text-2xl 2xl:text-3xl font-bold text-[var(--teal-800)] mb-4'>
            Imagen
          </h2>
          <div
            className={`relative w-full h-80 md:h-96 rounded-xl overflow-hidden shadow-md group ${
              localEvent.image &&
              localEvent.image !== '/placeholder.svg'
                ? 'cursor-pointer'
                : ''
            }`}
          >
            <Image
              src={localEvent.image || '/placeholder.svg'}
              alt={localEvent.title || 'Imagen del evento'}
              fill
              className='object-cover bg-gray-200'
              onClick={() =>
                openImageModal(localEvent.image)
              }
              style={{ transition: 'transform 0.3s ease' }}
              onMouseOver={(e) =>
                event.image &&
                event.image !== '/placeholder.svg'
                  ? (e.currentTarget.style.transform =
                      'scale(1.05)')
                  : null
              }
              onMouseOut={(e) =>
                event.image &&
                event.image !== '/placeholder.svg'
                  ? (e.currentTarget.style.transform =
                      'scale(1)')
                  : null
              }
            />
          </div>
        </div>

        <div className='lg:w-1/2 space-y-8'>
          <h2 className='text-xl lg:text-2xl 2xl:text-3xl font-bold text-[var(--teal-800)] mb-4'>
            Información Clave
          </h2>

          <div>
            <h3 className='font-semibold text-gray-700 text-base 2xl:text-2xl mb-3 flex items-center gap-2'>
              <span className='text-xl 2xl:text-2xl'>
                🗓️
              </span>
              <div>Fecha y Hora</div>
            </h3>
            <div className='pl-8 2xl:pl-10'>
              <p className='text-gray-900 text-base 2xl:text-xl'>
                {formatTimestamp(localEvent.date, {
                  dateStyle: 'full',
                  timeStyle: 'short',
                })}
              </p>
              <button
                disabled={
                  localEvent.status === 'cancelled' ||
                  localEvent.status === 'suspended' ||
                  hasEventPassed(event.date)
                }
                type='button'
                onClick={() => {
                  const calendarUrl = addToGoogleCalendar({
                    title: event.title,
                    date: event.date,
                    description: event.description,
                    address: event.address,
                    duration: event.duration || 120,
                  })
                  window.open(
                    calendarUrl,
                    '_blank',
                    'noopener,noreferrer',
                  )
                }}
                className='mt-2 inline-flex items-center gap-1.5 text-sm border border-[var(--primary)] text-[var(--blue-500)] hover:text-green-700 px-3 py-1 rounded-md font-medium transition-colors disabled:text-[var(--gray-300)] disabled:cursor-not-allowed disabled:hover:none disabled:border-[var(--gray-300)]'
                title='Añadir a Google Calendar'
              >
                <SiGooglecalendar className='inline' />
                Añadir a mi calendario
              </button>
            </div>
          </div>

          {localEvent.duration && (
            <div>
              <h3 className='font-semibold text-gray-700 text-base 2xl:text-2xl mb-3 flex items-center gap-2'>
                <span className='text-xl 2xl:text-2xl'>
                  ⏰
                </span>
                Duración
              </h3>
              <p className='text-gray-900 text-base 2xl:text-xl pl-12 2xl:pl-10'>
                {(() => {
                  const totalMinutes = Math.round(
                    localEvent.duration * 60,
                  )
                  const hours = Math.floor(
                    totalMinutes / 60,
                  )
                  const minutes = totalMinutes % 60
                  return `${hours > 0 ? `${hours}h` : ''}${
                    hours > 0 && minutes > 0 ? ' ' : ''
                  }${minutes > 0 ? `${minutes}m` : ''}`
                })()}{' '}
                aproximadamente.
              </p>
            </div>
          )}

          {
            (localEvent.price = !NaN && (
              <div>
                <h3 className='font-semibold text-gray-700 text-base 2xl:text-2xl mb-3 flex items-center gap-2'>
                  <span className='text-xl 2xl:text-2xl'>
                    🎟️
                  </span>
                  Precio
                </h3>
                <p className='text-gray-900 text-base 2xl:text-xl pl-12 2xl:pl-10'>
                  {priceDisplay}
                </p>
              </div>
            ))
          }

          {localEvent.venueName && (
            <div>
              <h3 className='font-semibold text-gray-700 text-base 2xl:text-2xl mb-3 flex items-center gap-2'>
                <span className='text-xl 2xl:text-2xl'>
                  📍
                </span>
                Lugar
              </h3>
              <span title='Ver detalles del lugar'>
                <Link
                  href={`/venues/${localEvent.venueId}`}
                  className='pl-8 2xl:pl-10 font-bold text-base 2xl:text-xl text-blue-800 hover:text-blue-600 hover:underline transition-colors'
                >
                  {localEvent.venueName}
                  <FiEye className='ml-2 inline' />
                </Link>
              </span>
            </div>
          )}

          <div>
            <h3 className='font-semibold text-gray-700 text-base 2xl:text-2xl mb-3'>
              <span className='text-xl 2xl:text-2xl'>
                ⭐
              </span>{' '}
              Tu Puntuación
            </h3>
            <div className='pl-12'>
              {user ? (
                <>
                  <StarRatingInput
                    initialRating={userRating}
                    onRatingSubmit={handleRatingSubmit}
                    onDeleteClick={handleDeleteRating}
                    showDeleteButton={userRating > 0}
                    disabled={
                      isSubmittingRating ||
                      isDeletingRating ||
                      !hasEventPassed(localEvent?.date) ||
                      localEvent?.status === 'cancelled' ||
                      localEvent?.status === 'suspended'
                    }
                    size={28}
                  />
                  {isSubmittingRating && (
                    <p className='text-sm text-gray-500 mt-2 animate-pulse'>
                      Enviando...
                    </p>
                  )}
                  {isDeletingRating && (
                    <p className='text-sm text-gray-500 mt-2 animate-pulse'>
                      Eliminando...
                    </p>
                  )}
                  {ratingError && (
                    <p className='text-sm text-red-600 mt-2 font-medium'>
                      {ratingError}
                    </p>
                  )}
                  {ratingSuccess && (
                    <p className='text-base text-[var(--accent)] mt-2 font-semibold tracking-wider'>
                      ¡Gracias por tu puntuación!
                    </p>
                  )}
                  {deleteSuccess && (
                    <p className='text-base text-[var(--accent)] mt-2 font-semibold tracking-wider'>
                      Tu puntuación ha sido eliminada.
                    </p>
                  )}
                  {currentUserRole && (
                    <p className='text-sm text-gray-50 mt-2'>
                      La puntuación solo está disponible
                      para cuentas personales
                    </p>
                  )}
                  {!hasEventPassed(localEvent?.date) &&
                    !isSubmittingRating &&
                    !isDeletingRating &&
                    localEvent?.status !== 'cancelled' &&
                    event?.status !== 'suspended' && (
                      <p className='text-sm text-gray-500 mt-2 italic'>
                        La puntuación se habilita luego del
                        evento. Retorna a dejar tu puntaje!
                      </p>
                    )}
                  {(localEvent?.status === 'cancelled' ||
                    localEvent?.status === 'suspended') &&
                    !isSubmittingRating &&
                    !isDeletingRating && (
                      <p className='text-sm text-gray-500 mt-2 italic'>
                        La puntuación no está disponible
                        para este evento (
                        {status?.label?.toLowerCase()}).
                      </p>
                    )}
                </>
              ) : (
                <p className='text-sm text-gray-600 italic'>
                  <Link
                    href='/login'
                    className='text-blue-600 hover:underline'
                  >
                    Inicia sesión
                  </Link>{' '}
                  para dejar tu puntuación.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {localEvent.ticketUrl &&
        !hasEventPassed(localEvent.date) &&
        localEvent.status !== 'cancelled' && (
          <div className='text-center mb-8 lg:mb-12 2xl:mb-16'>
            <a
              href={localEvent.ticketUrl}
              target='_blank'
              rel='noopener noreferrer'
              className='inline-block bg-gradient-to-r from-[var(--primary)] to-[var(--secondary-color)] text-white font-bold py-3 px-8 rounded-full hover:shadow-lg hover:from-[var(--secondary-color)] hover:to-[var(--primary)]'
            >
              Comprar Entradas
            </a>
          </div>
        )}

      {isModalOpen && modalImageUrl && (
        <div
          className='fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4'
          onClick={closeImageModal}
        >
          <div
            className='relative max-w-3xl max-h-[80vh] bg-white rounded-lg overflow-hidden shadow-xl'
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={modalImageUrl}
              alt={
                localEvent.title ||
                'Imagen del evento ampliada'
              }
              width={1200}
              height={800}
              style={{
                objectFit: 'contain',
                maxHeight: '80vh',
                width: 'auto',
              }}
            />
            <button
              onClick={closeImageModal}
              className='absolute top-2 right-2 bg-white/50 hover:bg-white/80 text-black rounded-full p-1.5 focus:outline-none'
              aria-label='Cerrar imagen'
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                className='h-5 w-5'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
                strokeWidth={2}
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  d='M6 18L18 6M6 6l12 12'
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  )
}

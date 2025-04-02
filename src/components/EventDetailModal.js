'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import Link from 'next/link'

// Helper function to get currency symbol
const getCurrencySymbol = (currencyCode) => {
  switch (currencyCode) {
    case 'USD':
      return '$'
    case 'EUR':
      return '€'
    case 'GBP':
      return '£'
    case 'BOB':
      return 'Bs'
    case 'BRL':
      return 'R$'
    case 'ARS':
      return '$'
    case 'CLP':
      return '$'
    case 'COP':
      return '$'
    case 'MXN':
      return '$'
    case 'PEN':
      return 'S/'
    case 'UYU':
      return '$U'
    case 'PYG':
      return '₲'
    default:
      return currencyCode || 'Bs'
  }
}

// Helper function to format date and time
const formatDateTime = (timestamp) => {
  if (!timestamp || !timestamp.seconds)
    return 'Fecha/Hora no disponible'
  try {
    return new Date(
      timestamp.seconds * 1000,
    ).toLocaleString('es-ES', {
      dateStyle: 'long', // e.g., 15 de abril de 2024
      timeStyle: 'short', // e.g., 19:30
    })
  } catch (error) {
    console.error('Error formatting date:', error)
    return 'Fecha/Hora inválida'
  }
}

// Helper function to get Spanish category label
const getCategoryLabel = (categoryValue) => {
  const labels = {
    music: 'Música',
    art: 'Arte',
    theater: 'Teatro',
    dance: 'Danza',
    comedy: 'Comedia',
    workshop: 'Taller',
    conference: 'Conferencia',
    literature: 'Literatura',
    film: 'Cine',
    gastronomy: 'Gastronomía',
    kids: 'Infantil',
    community: 'Comunitario',
    technology: 'Tecnología',
    fashion: 'Moda',
    sports: 'Deportes',
    other: 'Otro',
  }
  return (
    labels[categoryValue] ||
    categoryValue ||
    'Sin categoría'
  )
}

const EventDetailModal = ({ isOpen, onClose, event }) => {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isMounted || !isOpen || !event) return null

  return createPortal(
    <div className='fixed inset-0 z-[9999] flex items-center justify-center p-4'>
      <div
        className='fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity duration-300 ease-in-out'
        onClick={onClose}
        aria-hidden='true'
      />

      <div className='relative backdrop-blur-md border border-[var(--border)] rounded-xl shadow-2xl w-full max-w-3xl mx-auto my-8 z-[10000] max-h-[90vh] overflow-y-auto flex flex-col custom-scrollbar'>
        <style jsx>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 20px;
          }

          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.2);
            border-radius: 4px;
            margin: 8px 0;
          }

          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: var(--primary);
            border-radius: 4px;
            border: 1px solid rgba(255, 255, 255, 0.1);
          }

          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: var(--accent);
          }

          /* For Firefox */
          .custom-scrollbar {
            scrollbar-width: wide;
            scrollbar-color: var(--primary)
              rgba(0, 0, 0, 0.2);
          }
        `}</style>
        <div className='relative'>
          {event.featuredImage ? (
            <div className='relative w-full h-56 sm:h-72 md:h-80 rounded-t-xl overflow-hidden group animate-fade-in-up border-[10px] border-[#00f5a080]'>
              <Image
                src={event.featuredImage}
                alt={event.title}
                layout='fill'
                objectFit='cover'
                className='transition-transform duration-500 ease-in-out scale-110 group-hover:scale-100'
              />
              <div className='absolute inset-0 bg-gradient-to-t from-black/70 to-[var(--teal-700-transparent)]  scale-110 group-hover:scale-100 transition-all duration-500 ease-in-out'></div>
            </div>
          ) : (
            <div className='h-20 bg-gradient-to-r from-[var(--blue-500)] to-[var(--blue-800)] rounded-t-xl'></div>
          )}
          <button
            className='absolute top-4 right-4 text-[var(--white)] bg-black/40 rounded-full p-1.5 hover:bg-black/60 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--white)] focus:ring-offset-2 focus:ring-offset-[var(--gray-800)]'
            onClick={onClose}
            aria-label='Cerrar modal'
          >
            <svg
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
        <div className='bg-gradient-to-b from-[var(--secondary-color-transparent)] to-[var(--blue-800-transparent)] p-6 sm:p-8 flex-grow text-[var(--white)]'>
          <h2 className='text-2xl sm:text-3xl font-bold mb-5 leading-tight text-[var(--white)] text-shadow'>
            {event.title}
          </h2>

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5 mb-8 text-sm sm:text-base'>
            {/* Date & Time */}
            <div className='flex items-center space-x-3'>
              <span className='flex-shrink-0 w-6 h-6 text-[var(--secondary-color)]'>
                📅
              </span>
              <div>
                <p className='font-bold text-[var(--teal-200)]'>
                  Fecha y Hora
                </p>
                <p className='font-semibold text-[var(--white)]'>
                  {formatDateTime(event.date)}
                </p>
              </div>
            </div>

            {/* Location & Venue */}
            <div className='flex items-center space-x-3'>
              <span className='flex-shrink-0 w-6 h-6 text-[var(--secondary-color)]'>
                📍
              </span>
              <div>
                <p className='font-bold text-[var(--teal-200)]'>
                  Ubicación
                </p>
                {event.venueName && (
                  <Link
                    href={`/venues/${event.venueId}`}
                    className='block text-[var(--secondary-color)] underline hover:text-[var(--white)] font-semibold'
                  >
                    {event.venueName}
                  </Link>
                )}
                <p className='text-[var(--gray-100)] text-xs sm:text-sm'>
                  {event.address ||
                    'Dirección no especificada'}
                  , {event.city}, {event.country}
                </p>
              </div>
            </div>

            {/* Category */}
            {event.category && (
              <div className='flex items-center space-x-3'>
                <span className='flex-shrink-0 w-6 h-6 text-[var(--secondary-color)]'>
                  🏷️
                </span>
                <div>
                  <p className='font-bold text-[var(--teal-200)]'>
                    Categoría
                  </p>
                  <p className='font-semibold text-[var(--white)]'>
                    {getCategoryLabel(event.category)}
                  </p>
                </div>
              </div>
            )}

            {/* Price */}
            <div className='flex items-center space-x-3'>
              <span className='flex-shrink-0 w-6 h-6 text-[var(--secondary-color)]'>
                💰
              </span>
              <div>
                <p className='font-bold text-[var(--teal-200)]'>
                  Precio
                </p>
                <p className='font-semibold text-[var(--white)]'>
                  {event.price > 0
                    ? `${getCurrencySymbol(
                        event.currency,
                      )} ${event.price.toFixed(2)}`
                    : 'Gratis'}
                </p>
              </div>
            </div>
          </div>

          <div className='mb-8'>
            <h3 className='text-lg font-semibold border-b border-[var(--border)] pb-1 mb-2 text-[var(--white)]'>
              Descripción del Evento
            </h3>
            <p className='whitespace-pre-wrap leading-relaxed text-sm sm:text-base text-[var(--gray-100)]'>
              {event.description}
            </p>
          </div>
        </div>

        {event.ticketUrl && (
          <div className='bg-[var(--blue-800-transparent)] backdrop-blur-md px-6 sm:px-8 py-4 rounded-b-xl mt-auto border-t border-[#ffffff33]'>
            <a
              href={event.ticketUrl}
              target='_blank'
              rel='noopener noreferrer'
              className='w-full flex items-center justify-center bg-gradient-to-r from-[var(--teal-800)] to-[var(--teal-300)] text-[var(--white)] font-bold py-3 px-6 rounded-lg hover:from-[var(--teal-300)] hover:to-[var(--teal-800)] transition-all duration-300 ease-in-out shadow-md hover:shadow-lg transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--teal-500)]'
            >
              <span className='mr-2'>🎟️</span> Comprar
              Entradas
            </a>
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}

export default EventDetailModal

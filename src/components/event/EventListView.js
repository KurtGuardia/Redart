'use client'

import { useState, useEffect, useRef } from 'react'
import { CATEGORIES } from '../../lib/constants'
import { useEvents } from '../../hooks/useEvents'
import { useUserLocationDetection } from '../../hooks/useUserLocationDetection'
import EventCard from './EventCard'
import EventCardSkeleton from './EventCardSkeleton'
import Modal from '../ui/Modal'
import DeniedLocationInstructions from '../DeniedLocationInstructions'
import { useBrowserLocationInstructions } from '../../hooks/useBrowserLocationInstructions'

const EventListView = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all')
  const [spinnerKey, setSpinnerKey] = useState(0)
  const [debouncedSearchTerm, setDebouncedSearchTerm] =
    useState(searchTerm)
  const [showLocationModal, setShowLocationModal] =
    useState(false)
  const [showPermissionModal, setShowPermissionModal] =
    useState(false)
  const [cityFilter, setCityFilter] = useState(null)
  const [
    isLocationCheckComplete,
    setIsLocationCheckComplete,
  ] = useState(false)
  const isInitialMount = useRef(true)
  const searchInputRef = useRef(null) // ref for focus

  const { browser, instructions } =
    useBrowserLocationInstructions()

  // Use the location detection hook
  const {
    location: userCoords,
    locationDetails: userLocationDetails,
    loading: loadingUserLocation,
    error: userLocationError,
    permissionState,
    requestPermissionAndDetect,
  } = useUserLocationDetection()

  // Use the custom hook, passing the debounced search term, filter, and city filter
  const {
    eventsList,
    loading: loadingEvents,
    isFetchingMore,
    hasMore,
    error: eventsError,
    loadMoreEvents,
  } = useEvents(
    debouncedSearchTerm,
    filter,
    cityFilter?.city,
    isLocationCheckComplete,
  )

  // Effect for city filter based on user location
  useEffect(() => {
    if (
      permissionState === 'granted' &&
      !loadingUserLocation &&
      (userLocationDetails?.city ||
        userLocationDetails?.country_code)
    ) {
      setCityFilter({
        city: userLocationDetails?.city,
        country: userLocationDetails?.country_code,
      })
    } else {
      setCityFilter(null)
    }

    if (
      permissionState === 'prompt' &&
      !loadingUserLocation &&
      !userLocationError
    ) {
      setShowLocationModal(true)
    } else {
      // If not showing modal, location check is considered complete for rendering purposes
      setShowLocationModal(false)
    }
    // Mark location check as complete once loading is done and we have a state
    if (!loadingUserLocation) {
      setIsLocationCheckComplete(true)
    }
  }, [
    permissionState,
    loadingUserLocation,
    userLocationDetails,
    userLocationError,
  ])

  // Effect to debounce search term
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 1000)

    return () => {
      clearTimeout(timerId)
    }
  }, [searchTerm])

  // Effect to refocus search input after loading completes (post-initial mount)
  useEffect(() => {
    // Check only when loading transitions from true to false
    if (!loadingEvents && !loadingUserLocation) {
      if (isInitialMount.current) {
        // If it was the initial mount, just mark it as finished and don't focus
        isInitialMount.current = false
      } else {
        // If it wasn't the initial mount, focus the input
        searchInputRef.current?.focus()
      }
    }
  }, [loadingEvents, loadingUserLocation])

  const handleSearchChange = (e) => {
    const newSearchTerm = e.target.value
    setSearchTerm(newSearchTerm)
    setSpinnerKey((prevKey) => prevKey + 1) // Increment key to reset animation
  }

  const handleCategoryFilterChange = (e) => {
    const newFilter = e.target.value
    setFilter(newFilter)
  }

  const handleLoadMore = () => {
    if (!loadingEvents && !isFetchingMore && hasMore) {
      // Call the function from the hook
      loadMoreEvents()
    }
  }

  function handleAllowLocation() {
    setShowLocationModal(false)
    requestPermissionAndDetect()
  }

  function handleDenyLocation() {
    setShowLocationModal(false)
  }

  const isLoading =
    (loadingEvents || loadingUserLocation) &&
    !isLocationCheckComplete // Adjusted loading logic

  // If loading user location or events, show skeleton
  if (isLoading) {
    return (
      <>
        {/* Search and Filter UI */}
        <div className='flex flex-col md:flex-row items-center justify-center gap-4 mb-8'>
          {/* Search input (disabled) */}
          <div className='relative w-full md:w-1/3 flex items-center gap-2'>
            <svg
              key={spinnerKey}
              className='w-5 h-5 text-teal-600 shrink-0 animate-spin'
              viewBox='0 0 20 20'
              fill='none'
              xmlns='http://www.w3.org/2000/svg'
            >
              <circle
                cx='10'
                cy='10'
                r='8'
                stroke='currentColor'
                strokeWidth='2'
                strokeOpacity='0.3'
              />
              <circle
                cx='10'
                cy='10'
                r='8'
                stroke='currentColor'
                strokeWidth='2'
                strokeDasharray='var(--circumference)'
                strokeDashoffset='var(--circumference)'
                transform='rotate(-90 10 10)'
              />
            </svg>
            <input
              type='text'
              placeholder='Buscar eventos, lugares, ciudades...'
              value={searchTerm ?? ''} // Add value prop here too
              className='bg-white w-full px-4 xl:py-2 py-1 border-2 border-gray-300 rounded-lg shadow-sm focus:border-teal-500 pr-10 focus-visible:outline-none'
              disabled={true}
            />
          </div>
          {/* Category Filter (disabled) */}
          <div className='relative w-full md:w-auto shrink-0'>
            <select
              className='w-full md:w-48 px-4 xl:py-2 py-1 border-2 border-gray-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500 outline-none appearance-none bg-white pr-8 cursor-not-allowed'
              disabled={true}
            >
              <option value='all'>Categorías</option>
            </select>
            <div className='pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700'>
              <svg
                className='fill-current h-4 w-4'
                xmlns='http://www.w3.org/2000/svg'
                viewBox='0 0 20 20'
              >
                <path d='M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z' />
              </svg>
            </div>
          </div>
        </div>

        {/* Loading skeletons */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 xl:gap-8 gap-8 px-1 xl:px-16'>
          {Array.from({ length: 4 }).map((_, index) => (
            <EventCardSkeleton
              key={`initial-skeleton-${index}`}
            />
          ))}
        </div>
      </>
    )
  }

  // If user denied location permission
  if (
    permissionState === 'denied' ||
    (userLocationError && permissionState !== 'granted')
  ) {
    return (
      <>
        {/* Search and Filter */}
        <div className='flex flex-col md:flex-row items-center justify-center gap-4 mb-8'>
          {/* Search Input with Spinner */}
          <div className='relative w-full md:w-1/3 flex items-center gap-2'>
            <svg
              key={spinnerKey}
              className='w-5 h-5 text-teal-600 shrink-0'
              viewBox='0 0 20 20'
              fill='none'
              xmlns='http://www.w3.org/2000/svg'
              style={{
                '--circumference': 2 * Math.PI * 8,
                '--duration': '1000ms',
              }}
            >
              {/* Background track */}
              <circle
                cx='10'
                cy='10'
                r='8'
                stroke='currentColor'
                strokeWidth='2'
                strokeOpacity='0.3' // Lighter track
              />
              {/* Animated progress arc */}
              <circle
                cx='10'
                cy='10'
                r='8'
                stroke='currentColor'
                strokeWidth='2'
                strokeDasharray='var(--circumference)'
                strokeDashoffset='var(--circumference)' // Start empty
                transform='rotate(-90 10 10)'
                className='animate-debounce-spinner'
              />
            </svg>

            <input
              type='text'
              placeholder='Buscar eventos, lugares, ciudades...'
              ref={searchInputRef}
              value={searchTerm ?? ''}
              onChange={handleSearchChange}
              className='bg-white w-full px-4 xl:py-2 py-1 border-2 border-gray-300 rounded-lg shadow-sm  focus:border-teal-500 pr-10 focus-visible:outline-none'
              disabled={isLoading || isFetchingMore}
            />

            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none'
                aria-label='Clear search'
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  className='h-5 w-5'
                  viewBox='0 0 20 20'
                  fill='currentColor'
                >
                  <path
                    fillRule='evenodd'
                    d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                    clipRule='evenodd'
                  />
                </svg>
              </button>
            )}
          </div>
          {/* Category Filter */}
          <div className='relative w-full md:w-auto shrink-0'>
            <select
              value={filter}
              onChange={handleCategoryFilterChange}
              className='w-full md:w-48 px-4 xl:py-2 py-1 border-2 border-gray-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500 outline-none appearance-none bg-white pr-8 cursor-pointer'
              disabled={isLoading || isFetchingMore}
            >
              <option value='all'>Categorías</option>
              {CATEGORIES.map((category) => (
                <option
                  key={category.value}
                  value={category.value}
                >
                  {category.label}
                </option>
              ))}
            </select>
            <div className='pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700'>
              <svg
                className='fill-current h-4 w-4'
                xmlns='http://www.w3.org/2000/svg'
                viewBox='0 0 20 20'
              >
                <path d='M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z' />
              </svg>
            </div>
          </div>
        </div>

        <DeniedLocationInstructions
          showPermissionModal={showPermissionModal}
          setShowPermissionModal={setShowPermissionModal}
          browser={browser}
          instructions={instructions}
          userLocationError={userLocationError}
        />

        {/* Display event cards when data is loaded */}
        <div className='mt-8'>
          <h2 className='text-lg text-center mb-6 text-teal-700 font-semibold'>
            Mostrando todos los eventos disponibles
          </h2>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 xl:gap-8 gap-8 px-1 xl:px-16'>
            {eventsList.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
            {isFetchingMore &&
              Array.from({ length: 4 }).map((_, index) => (
                <EventCardSkeleton
                  key={`loading-more-${index}`}
                />
              ))}
          </div>
        </div>

        {/* Show message if no events match the filters */}
        {!isLoading &&
          !eventsError &&
          eventsList.length === 0 && (
            <p className='col-span-full text-center text-gray-500 py-10'>
              No se encontraron eventos que coincidan con
              los filtros.
            </p>
          )}

        {/* Show load more button if there are more events to fetch */}
        {!isLoading &&
          isLocationCheckComplete && // Only show when location check is done
          !eventsError &&
          !isFetchingMore &&
          hasMore && (
            <div className='mt-12 text-center'>
              <button
                onClick={handleLoadMore}
                className='bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-6 rounded-full transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed'
                disabled={isFetchingMore}
              >
                Cargar más
              </button>
            </div>
          )}
      </>
    )
  }

  // When permission state is 'prompt' - waiting for user approval
  if (permissionState === 'prompt') {
    return (
      <div className='flex flex-col justify-center items-center text-center h-[60vh] bg-gray-100 p-4 rounded-lg'>
        <Modal
          isOpen={showLocationModal}
          onClose={() => setShowLocationModal(false)}
          onReject={handleDenyLocation}
          onAccept={handleAllowLocation}
          title='¿Permites acceso a tu ubicación?'
        >
          Para mostrarte los eventos más cercanos a tu
          ubicación, necesitamos acceder a tu ubicación.
          <br />
          <span className='font-semibold text-teal-700'>
            No almacenamos tu ubicación
          </span>
          , solo se usa para filtrar eventos cercanos.
          <br /> <br />
          ¿Deseas continuar?
        </Modal>
        <p className='text-2xl text-[var(--blue-800)] font-bold tracking-wider animate-bounce mb-4'>
          Esperando permiso de ubicación...
        </p>
      </div>
    )
  }

  // Default view when permission is granted
  return (
    <>
      {/* Search and Filter */}
      <div className='flex flex-col md:flex-row items-center justify-center gap-4 mb-8'>
        {/* Search Input with Spinner */}
        <div className='relative w-full md:w-1/3 flex items-center gap-2'>
          {/* Animated Spinner */}
          <svg
            key={spinnerKey}
            className='w-5 h-5 text-teal-600 shrink-0'
            viewBox='0 0 20 20'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
            style={{
              '--circumference': 2 * Math.PI * 8,
              '--duration': '1000ms',
            }}
          >
            {/* Background track */}
            <circle
              cx='10'
              cy='10'
              r='8'
              stroke='currentColor'
              strokeWidth='2'
              strokeOpacity='0.3' // Lighter track
            />
            {/* Animated progress arc */}
            <circle
              cx='10'
              cy='10'
              r='8'
              stroke='currentColor'
              strokeWidth='2'
              strokeDasharray='var(--circumference)'
              strokeDashoffset='var(--circumference)' // Start empty
              transform='rotate(-90 10 10)'
              className='animate-debounce-spinner'
            />
          </svg>

          <input
            type='text'
            placeholder='Buscar eventos, lugares, ciudades...'
            ref={searchInputRef}
            value={searchTerm ?? ''}
            onChange={handleSearchChange}
            className='bg-white w-full px-4 xl:py-2 py-1 border-2 border-gray-300 rounded-lg shadow-sm  focus:border-teal-500 pr-10 focus-visible:outline-none'
            disabled={isLoading || isFetchingMore}
          />

          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none'
              aria-label='Clear search'
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                className='h-5 w-5'
                viewBox='0 0 20 20'
                fill='currentColor'
              >
                <path
                  fillRule='evenodd'
                  d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                  clipRule='evenodd'
                />
              </svg>
            </button>
          )}
        </div>
        {/* Category Filter */}
        <div className='relative w-full md:w-auto shrink-0'>
          <select
            value={filter}
            onChange={handleCategoryFilterChange}
            className='w-full md:w-48 px-4 xl:py-2 py-1 border-2 border-gray-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500 outline-none appearance-none bg-white pr-8 cursor-pointer'
            disabled={isLoading || isFetchingMore}
          >
            <option value='all'>Categorías</option>
            {CATEGORIES.map((category) => (
              <option
                key={category.value}
                value={category.value}
              >
                {category.label}
              </option>
            ))}
          </select>
          <div className='pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700'>
            <svg
              className='fill-current h-4 w-4'
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 20 20'
            >
              <path d='M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z' />
            </svg>
          </div>
        </div>
      </div>

      {/* City filter label */}
      {cityFilter?.city && (
        <div className='flex justify-center mb-4'>
          <div className='inline-flex text-center items-center gap-2 px-4 py-1 bg-teal-100 text-teal-800 rounded-full'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='h-7 w-7'
              viewBox='0 0 20 20'
              fill='currentColor'
            >
              <path
                fillRule='evenodd'
                d='M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z'
                clipRule='evenodd'
              />
            </svg>
            Mostrando eventos en {cityFilter.city}
            {/* <button
              onClick={() => setCityFilter(null)}
              className='ml-1 text-teal-600 hover:text-teal-800 focus:outline-none'
              aria-label='Clear location filter'
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                className='h-4 w-4'
                viewBox='0 0 20 20'
                fill='currentColor'
              >
                <path
                  fillRule='evenodd'
                  d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                  clipRule='evenodd'
                />
              </svg>
            </button> */}
          </div>
        </div>
      )}

      {/* Display error message if fetch failed */}
      {eventsError && !isLoading && (
        <p className='col-span-full text-center text-red-600 py-10'>
          😞 Ocurrió un error al cargar los eventos:{' '}
          {eventsError.message}
        </p>
      )}

      {/* Display event cards when data is loaded */}
      {isLocationCheckComplete && // Only render when location check is done
        !loadingEvents && // And events are not loading (initial or filter change)
        !eventsError && ( // Wait for location *and* events
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 xl:gap-8 gap-8 px-1 xl:px-16'>
            {eventsList.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
            {isFetchingMore &&
              Array.from({ length: 4 }).map((_, index) => (
                <EventCardSkeleton
                  key={`loading-more-${index}`}
                />
              ))}
          </div>
        )}

      {/* Show message if no events match the filters */}
      {!isLoading &&
        isLocationCheckComplete && // Only show when location check is done
        !eventsError && // Wait for location before showing "no events"
        eventsList.length === 0 && (
          <p className='col-span-full text-center text-gray-500 py-10'>
            No se encontraron eventos que coincidan con los
            filtros.
          </p>
        )}

      {/* Show load more button if there are more events to fetch */}
      {!isLoading &&
        !loadingUserLocation &&
        !eventsError && // Wait for location before showing "load more"
        !isFetchingMore &&
        hasMore && (
          <div className='mt-12 text-center'>
            <button
              onClick={handleLoadMore}
              className='bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-6 rounded-full transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed'
              disabled={isFetchingMore}
            >
              Cargar más
            </button>
          </div>
        )}
    </>
  )
}

export default EventListView

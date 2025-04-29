'use client'

import { useState, useEffect } from 'react'
import { db } from '../../lib/firebase-client' // Updated path
import {
  doc,
  getDoc,
  runTransaction,
  Timestamp,
} from 'firebase/firestore'
import Image from 'next/image'
import MapComponent from '../map/MapComponent' // Updated path
import {
  FaWhatsapp,
  FaInstagram,
  FaFacebook,
  FaStar,
} from 'react-icons/fa'
import {
  formatWhatsappNumber,
  generateGoogleMapsUrl,
} from '../../lib/utils' // Updated path
import { Skeleton } from '../ui/Skeleton' // Make sure Skeleton is imported
import { useAuth } from '../../hooks/useAuth' // Import the auth hook
import StarRatingInput from '../ui/StarRatingInput' // Assuming you have a Button component
import Link from 'next/link'
import LocationPinIcon from '../LocationPinIcon'

export default function VenueDetailFetcher({ venueId }) {
  const [venue, setVenueData] = useState(null)
  const [loadingVenue, setLoadingVenue] = useState(true)
  const [errorVenue, setErrorVenue] = useState(null)
  const [currentUserRole, setCurrentUserRole] =
    useState(null)
  // console.log(currentUserRole)
  const { user, loadingAuth } = useAuth()

  const [userRating, setUserRating] = useState(0)
  const [isSubmittingRating, setIsSubmittingRating] =
    useState(false)
  const [ratingError, setRatingError] = useState(null)
  const [ratingSuccess, setRatingSuccess] = useState(false)
  console.log(venue)
  useEffect(() => {
    if (venue?.ratings && user?.uid) {
      const existingRating = venue.ratings.find(
        (r) => r.userId === user.uid,
      )
      setUserRating(
        existingRating ? existingRating.score : 0,
      )
    } else {
      setUserRating(0)
    }
  }, [venue, user])

  let averageRating = 0
  let ratingCount = 0
  if (venue?.ratings && Array.isArray(venue.ratings)) {
    const scores = venue.ratings
      .map((r) => r.score)
      .filter((score) => typeof score === 'number')
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
    if (!venueId) {
      setErrorVenue(new Error('Venue ID no proporcionado.'))
      setLoadingVenue(false)
      return
    }

    const fetchData = async () => {
      setLoadingVenue(true)
      setErrorVenue(null)
      setVenueData(null)

      try {
        const venueRef = doc(db, 'venues', venueId)
        const venueSnap = await getDoc(venueRef)

        if (!venueSnap.exists()) {
          setErrorVenue(new Error('Lugar no encontrado.'))
          setLoadingVenue(false)
          return
        }

        const rawVenueData = venueSnap.data()
        const processedVenueData = {
          id: venueSnap.id,
          ...rawVenueData,
          ratings: Array.isArray(rawVenueData.ratings)
            ? rawVenueData.ratings
            : [],
          createdAt: rawVenueData.createdAt?.toDate
            ? rawVenueData.createdAt.toDate().toISOString()
            : null,
          updatedAt: rawVenueData.updatedAt?.toDate
            ? rawVenueData.updatedAt.toDate().toISOString()
            : null,
          location: rawVenueData.location
            ? {
                latitude:
                  rawVenueData.location.latitude ??
                  rawVenueData.location._latitude ??
                  rawVenueData.location.lat ??
                  null,
                longitude:
                  rawVenueData.location.longitude ??
                  rawVenueData.location._longitude ??
                  rawVenueData.location.lng ??
                  null,
              }
            : null,
          photos: Array.isArray(rawVenueData.photos)
            ? rawVenueData.photos
            : [],
        }
        if (
          processedVenueData.location &&
          (processedVenueData.location.latitude === null ||
            processedVenueData.location.longitude === null)
        ) {
          processedVenueData.location = null
        }

        setVenueData(processedVenueData)
      } catch (err) {
        console.error(
          'Error fetching venue details client-side:',
          err,
        )
        setErrorVenue(
          err instanceof Error
            ? err
            : new Error('Error al cargar los datos.'),
        )
      } finally {
        setLoadingVenue(false)
      }
    }

    fetchData()
  }, [venueId])

  const handleRatingSubmit = async (newRating) => {
    if (!user) {
      setRatingError('Debes iniciar sesión para puntuar.')
      return
    }
    if (!venue) {
      setRatingError('Datos del local no cargados.')
      return
    }

    setIsSubmittingRating(true)
    setRatingError(null)
    setRatingSuccess(false)

    const venueRef = doc(db, 'venues', venueId)
    const userRef = doc(db, 'users', user.uid)

    const ratingTimestamp = Timestamp.now()

    try {
      await runTransaction(db, async (transaction) => {
        const venueDoc = await transaction.get(venueRef)
        if (!venueDoc.exists()) {
          throw new Error('El local ya no existe.')
        }
        const currentVenueData = venueDoc.data()
        let currentRatings = Array.isArray(
          currentVenueData.ratings,
        )
          ? currentVenueData.ratings
          : []

        const userDoc = await transaction.get(userRef)
        if (!userDoc.exists()) {
          setCurrentUserRole('venue')
          throw new Error('Usuario no encontrado.')
        }

        const currentUserData = userDoc.data()
        let currentUserRatings = Array.isArray(
          currentUserData.ratings,
        )
          ? currentUserData.ratings
          : []

        const updatedVenueRatings = currentRatings.filter(
          (r) => r.userId !== user.uid,
        )
        updatedVenueRatings.push({
          userId: user.uid,
          score: newRating,
          updatedAt: ratingTimestamp,
        })
        transaction.update(venueRef, {
          ratings: updatedVenueRatings,
        })

        const updatedUserRatings =
          currentUserRatings.filter(
            (r) => r.targetId !== venueId,
          )
        updatedUserRatings.push({
          targetId: venueId,
          name: venue.name,
          type: 'venue',
          score: newRating,
          updatedAt: ratingTimestamp,
        })
        transaction.update(userRef, {
          ratings: updatedUserRatings,
        })
      })

      setVenueData((prevVenue) => ({
        ...prevVenue,
        ratings: prevVenue.ratings
          ? [
              ...prevVenue.ratings.filter(
                (r) => r.userId !== user.uid,
              ),
              {
                userId: user.uid,
                score: newRating,
                updatedAt: ratingTimestamp.toDate(),
              },
            ]
          : [
              {
                userId: user.uid,
                score: newRating,
                updatedAt: ratingTimestamp.toDate(),
              },
            ],
      }))
      setUserRating(newRating)
      setRatingSuccess(true)
      console.log('Rating submitted successfully!')
      setTimeout(() => setRatingSuccess(false), 3000)
    } catch (error) {
      console.error(
        'Error submitting rating transaction:',
        error,
      )
      setRatingError(
        error.message || 'Error al enviar la puntuación.',
      )
      setTimeout(() => setRatingError(null), 5000)
    } finally {
      setIsSubmittingRating(false)
    }
  }

  const isLoading = loadingVenue || loadingAuth

  if (isLoading) {
    return (
      <section className='mb-10 md:mb-12 border-b border-gray-200/80 pb-8 animate-pulse'>
        <div className='flex flex-col lg:flex-row gap-8 lg:gap-12'>
          {/* Left Column: Map Skeleton */}
          <div className='lg:w-1/2 flex flex-col space-y-4'>
            <Skeleton className='h-8 w-3/4 bg-gray-300' />{' '}
            {/* Title */}
            <Skeleton className='h-4 w-1/2 bg-gray-300' />{' '}
            {/* Subtitle */}
            <Skeleton className='h-80 md:h-96 w-full bg-gray-300 rounded-lg' />{' '}
            {/* Map Area */}
            <Skeleton className='h-5 w-3/4 mx-auto bg-gray-300 mt-4' />{' '}
            {/* Address Link */}
          </div>

          {/* Right Column: Details Skeleton */}
          <div className='lg:w-1/2 space-y-6'>
            <Skeleton className='h-8 w-3/4 bg-gray-300 mb-4' />{' '}
            {/* Title */}
            {/* Logo Placeholder */}
            <div className='flex justify-center md:justify-start mb-4'>
              <Skeleton className='w-[150px] h-[150px] bg-gray-300 rounded-full' />
            </div>
            {/* Capacity Skeleton */}
            <div className='flex items-center gap-5'>
              <Skeleton className='h-6 w-6 bg-gray-300 rounded-full' />
              <div className='space-y-2'>
                <Skeleton className='h-4 w-20 bg-gray-300' />
                <Skeleton className='h-4 w-32 bg-gray-300' />
              </div>
            </div>
            {/* Services Skeleton */}
            <div className='space-y-2'>
              <Skeleton className='h-5 w-24 bg-gray-300 mb-2' />
              <div className='flex flex-wrap gap-2 pl-8'>
                <Skeleton className='h-5 w-16 rounded-full bg-gray-300' />
                <Skeleton className='h-5 w-20 rounded-full bg-gray-300' />
                <Skeleton className='h-5 w-14 rounded-full bg-gray-300' />
              </div>
            </div>
            {/* Contact/Social Skeleton */}
            <div className='space-y-2'>
              <Skeleton className='h-5 w-32 bg-gray-300 mb-2' />
              <div className='space-y-2 pl-8'>
                <Skeleton className='h-5 w-24 bg-gray-300' />
                <Skeleton className='h-5 w-24 bg-gray-300' />
                <Skeleton className='h-5 w-24 bg-gray-300' />
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (errorVenue) {
    return (
      <div>
        Error al cargar el local: {errorVenue.message}
      </div>
    )
  }

  if (!venue) {
    return (
      <div>Lugar no encontrado o error inesperado.</div>
    )
  }

  const mapLocation =
    venue?.location?.latitude && venue?.location?.longitude
      ? {
          id: venue.id,
          name: venue.name,
          latitude: venue.location.latitude,
          longitude: venue.location.longitude,
        }
      : null
  const mapCenter = mapLocation
    ? [mapLocation.latitude, mapLocation.longitude]
    : null
  console.log(mapCenter)
  return (
    <section className='mb-10 md:mb-12 border-b border-gray-200/80 pb-8'>
      <div className='flex flex-col lg:flex-row gap-8 lg:gap-12'>
        {/* Left Column: Map */}
        <div className='lg:w-1/2 flex flex-col'>
          <h2 className='text-2xl lg:text-3xl 2xl:text-4xl font-bold text-[var(--teal-800)] mb-1'>
            Ubicación en el Mapa
          </h2>
          <p className='text-sm 2xl:text-base text-gray-500 mb-4'>
            {venue.city}, {venue.country}
          </p>
          {mapLocation ? (
            <div className='h-80 md:h-96 w-full 2xl:w-[80%] mx-auto xl:mt-6'>
              <MapComponent
                venues={[mapLocation]}
                center={mapCenter}
                zoom={16}
                hideSearch={true}
                mapId={`venue-map-${venue.id}`}
              />
            </div>
          ) : (
            <div className='h-80 md:h-96 w-full flex items-center justify-center bg-gray-100 text-gray-500 italic'>
              Ubicación no disponible en el mapa.
            </div>
          )}
          {venue.address && (
            <a
              href={generateGoogleMapsUrl({
                location: venue.location,
                address: venue.address,
                city: venue.city,
                country: venue.country,
              })}
              target='_blank'
              rel='noopener noreferrer'
              className='block text-center text-[var(--teal-800)] hover:text-[var(--teal-600)] hover:underline text-sm md:text-base mt-4'
            >
              <LocationPinIcon /> {venue.address}
            </a>
          )}
        </div>

        {/* Right Column: Details */}
        <div className='lg:w-1/2 space-y-8'>
          <h2 className='text-2xl 2xl:text-4xl md:text-3xl font-bold text-[var(--teal-800)] mb-4'>
            Detalles Adicionales
          </h2>

          <div className='flex flex-col md:flex-row justify-start md:items-end gap-4 mb-6'>
            {/* Logo Section */}
            <div className='flex-shrink-0'>
              {' '}
              {/* Prevent logo from shrinking too much */}
              <Image
                // Use placeholder if venue.logo is missing
                src={venue.logo || '/placeholder.svg'}
                alt={`${venue.name} Logo`}
                width={150}
                height={100}
                style={{ objectFit: 'contain' }} // Keep object-fit contain
                className='rounded-md bg-gray-200 dark:bg-gray-700' // Added subtle bg for placeholder
                // Optional: Add onError handler for broken image links
                onError={(e) => {
                  e.currentTarget.src = '/placeholder.svg'
                }}
              />
            </div>

            {/* Rating Section */}
            {ratingCount > 0 && (
              <div className='flex items-center gap-2 text-lg md:text-xl text-yellow-400'>
                <span className='font-bold'>
                  {averageRating.toFixed(1)}
                </span>
                <FaStar className='' />
                <span className='text-2xs text-gray-500 dark:text-gray-400 mb-[-5px]'>
                  ({ratingCount}{' '}
                  {ratingCount === 1
                    ? 'opinión'
                    : 'opiniones'}
                  )
                </span>
              </div>
            )}
          </div>

          {venue.capacity && (
            <div>
              <h3 className='font-semibold text-gray-700 text-base 2xl:text-2xl mb-3'>
                <span
                  className='text-2xl 2xl:text-3xl'
                  title='Capacidad'
                >
                  👥
                </span>{' '}
                Capacidad
              </h3>
              <p className='text-gray-900 text-base 2xl:text-xl pl-12'>
                {venue.capacity} personas
              </p>
            </div>
          )}

          <div>
            <h3 className='font-semibold text-gray-700 mb-3 flex items-center gap-2 text-base 2xl:text-2xl'>
              <span className='text-xl 2xl:text-3xl'>
                ✨
              </span>{' '}
              Servicios
            </h3>
            <ul className='list-none space-y-1 pl-12'>
              {venue.amenities &&
                venue.amenities.length > 0 && (
                  <div className='flex flex-wrap gap-2'>
                    {venue.amenities.map(
                      (amenity, index) => (
                        <span
                          key={index}
                          className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs 2xl:text-base font-medium bg-teal-100 text-teal-800'
                        >
                          <svg
                            className='w-3 h-3 mr-1'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M5 13l4 4L19 7'
                            />
                          </svg>
                          {amenity}
                        </span>
                      ),
                    )}
                  </div>
                )}
            </ul>
          </div>

          {(venue.facebookUrl ||
            venue.instagramUrl ||
            venue.whatsappNumber) && (
            <div>
              <h3 className='font-semibold text-gray-700 mb-3 flex items-center gap-2 text-base 2xl:text-2xl'>
                <span className='text-xl 2xl:text-3xl'>
                  🌐
                </span>{' '}
                Contacto / Redes
              </h3>
              <div className='space-y-2 pl-12'>
                {venue.facebookUrl && (
                  <a
                    href={venue.facebookUrl}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline'
                    title={venue.facebookUrl}
                  >
                    <FaFacebook className='w-5 h-5' />{' '}
                    <span className='truncate text-sm 2xl:text-lg'>
                      Facebook
                    </span>
                  </a>
                )}
                {venue.instagramUrl && (
                  <a
                    href={venue.instagramUrl}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='flex items-center gap-2 text-pink-600 hover:text-pink-800 hover:underline'
                    title={venue.instagramUrl}
                  >
                    <FaInstagram className='w-5 h-5' />{' '}
                    <span className='truncate text-sm 2xl:text-lg'>
                      Instagram
                    </span>
                  </a>
                )}
                {venue.whatsappNumber && (
                  <a
                    href={`https://wa.me/${venue.whatsappNumber.replace(
                      /\D/g,
                      '',
                    )}`}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='flex items-center gap-2 text-green-600 hover:text-green-800 hover:underline'
                    title={venue.whatsappNumber}
                  >
                    <FaWhatsapp className='w-5 h-5' />{' '}
                    <span className='truncate text-sm 2xl:text-lg'>
                      {formatWhatsappNumber(
                        venue.whatsappNumber,
                      )}
                    </span>
                  </a>
                )}
              </div>
            </div>
          )}

          <div>
            <h3 className='font-semibold text-gray-700 mb-3 flex items-center gap-2 text-base 2xl:text-2xl'>
              <span className='text-xl 2xl:text-3xl'>
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
                    disabled={isSubmittingRating}
                    size={28}
                  />
                  {isSubmittingRating && (
                    <p className='text-sm text-gray-500 mt-2'>
                      Enviando...
                    </p>
                  )}
                  {ratingError && (
                    <p className='text-sm text-red-500 mt-2'>
                      {ratingError}
                    </p>
                  )}
                  {ratingSuccess && (
                    <p className='text-sm text-green-500 mt-2'>
                      ¡Gracias por tu puntuación!
                    </p>
                  )}
                  {currentUserRole && (
                    <p className='text-sm text-gray-500 mt-2'>
                      La puntuación solo está disponible
                      para cuentas personales
                    </p>
                  )}
                </>
              ) : (
                <p className='text-sm text-gray-600 italic'>
                  <Link
                    variant='link'
                    className='p-0 h-auto text-[var(--secondary-color)]'
                    onClick={() => {}}
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
    </section>
  )
}

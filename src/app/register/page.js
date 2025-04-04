'use client'

import { useState, useEffect } from 'react'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import {
  auth,
  db,
  storage,
} from '../../lib/firebase-client'
import {
  doc,
  GeoPoint,
  setDoc,
  deleteDoc,
} from 'firebase/firestore'
import Link from 'next/link'
import Spot from '../../components/ui/Spot'
import MapComponent from '../../components/MapComponent'
import {
  getDownloadURL,
  ref,
  uploadBytes,
} from 'firebase/storage'
import Image from 'next/image'
import { countriesAndCities } from './countriesAndCities'
import { AMENITIES_OPTIONS } from '../../lib/constants'
import {
  compressImage,
  compressMultipleImages,
  validateFacebookUrl,
  validateInstagramUrl,
  validateWhatsappNumber,
} from '../../lib/utils'

// Define constants for form limits
const DESCRIPTION_MAX_LENGTH = 500
const MAX_PHOTOS = 5

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [logo, setLogo] = useState(null)
  const [description, setDescription] = useState('')
  const [descriptionCharsLeft, setDescriptionCharsLeft] =
    useState(DESCRIPTION_MAX_LENGTH)
  const [address, setAddress] = useState('')
  const [capacity, setCapacity] = useState('')
  const [geoPoint, setGeoPoint] = useState({
    lat: null,
    lng: null,
  })
  const [selectedAmenities, setSelectedAmenities] =
    useState([])
  const [password, setPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [passwordsMatch, setPasswordsMatch] = useState(true)
  const [photos, setPhotos] = useState([])
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [registerLoading, setRegisterLoading] =
    useState(false)
  const [selectedCountry, setSelectedCountry] = useState('')
  const [cities, setCities] = useState([])
  const [selectedCity, setSelectedCity] = useState('')
  const [isClientSide, setIsClientSide] = useState(false)
  const [facebookUrl, setFacebookUrl] = useState('')
  const [instagramUrl, setInstagramUrl] = useState('')
  const [whatsappNumber, setWhatsappNumber] = useState('')

  useEffect(() => {
    setIsClientSide(true)
  }, [])

  const handleCountryChange = (e) => {
    const country = e.target.value
    setSelectedCountry(country)
    setCities(countriesAndCities[country] || [])
    setSelectedCity('')
  }

  const validatePassword = (password) => {
    if (password.length < 6) {
      return 'La contraseña debe tener al menos 6 caracteres'
    }
    if (!/[A-Z]/.test(password)) {
      return 'La contraseña debe contener al menos una letra mayúscula'
    }
    return ''
  }

  const uploadPhotos = async (photos, venueId) => {
    // Compress all photos before uploading
    const compressedPhotos = await compressMultipleImages(
      photos,
    )

    const urls = []
    for (const photo of compressedPhotos) {
      const storageRef = ref(
        storage,
        `venues/${venueId}/photos/${photo.name}`,
      )
      await uploadBytes(storageRef, photo)
      const url = await getDownloadURL(storageRef)
      urls.push(url)
    }
    return urls
  }

  const uploadLogo = async (logo, venueId) => {
    if (!logo) return null

    // Compress the logo before uploading
    const compressedLogo = await compressImage(logo)

    const storageRef = ref(
      storage,
      `venues/${venueId}/logo/${compressedLogo.name}`,
    )
    await uploadBytes(storageRef, compressedLogo)
    const url = await getDownloadURL(storageRef)
    return url
  }

  const getFirstTwoWords = (text) => {
    if (!text) return ''
    const words = text.trim().split(/\s+/)
    const firstTwoWords = words.slice(0, 2).join(' ')
    return firstTwoWords
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('') // Clear previous errors
    setMessage('')

    // --- Start Validation ---
    const passwordError = validatePassword(password)
    if (passwordError) {
      setError(passwordError)
      return
    }
    if (password !== repeatPassword) {
      setError('Las contraseñas no coinciden')
      return
    }
    if (facebookUrl && !validateFacebookUrl(facebookUrl)) {
      setError('La URL de Facebook no parece válida.')
      return
    }
    if (
      instagramUrl &&
      !validateInstagramUrl(instagramUrl)
    ) {
      setError('La URL de Instagram no parece válida.')
      return
    }
    if (
      whatsappNumber &&
      !validateWhatsappNumber(whatsappNumber)
    ) {
      setError(
        'El número de WhatsApp debe empezar con + y el código de país.',
      )
      return
    }
    // --- End Validation ---

    setRegisterLoading(true)
    let userCredential = null

    try {
      // Step 1: Create a new user with email and password
      userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      )

      const venueId = userCredential.user.uid

      // Step 2: Upload logo and photos
      const logoUrl = await uploadLogo(logo, venueId)
      const photoUrls = await uploadPhotos(photos, venueId)

      const venueData = {
        name,
        logo: logoUrl,
        email,
        description,
        country: selectedCountry,
        city: selectedCity,
        address,
        capacity: Number(capacity),
        location: new GeoPoint(geoPoint.lat, geoPoint.lng),
        amenities: selectedAmenities,
        photos: photoUrls,
        ...(facebookUrl.trim() && {
          facebookUrl: facebookUrl.trim(),
        }),
        ...(instagramUrl.trim() && {
          instagramUrl: instagramUrl.trim(),
        }),
        ...(whatsappNumber.trim() && {
          whatsappNumber: whatsappNumber.trim(),
        }),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        active: true,
      }

      // Step 3: Add main venue document to 'venues' collection
      await setDoc(doc(db, 'venues', venueId), venueData)

      // Step 4: Add simplified location data to 'venues_locations' collection
      await setDoc(doc(db, 'venues_locations', venueId), {
        name: venueData.name,
        address: venueData.address,
        city: venueData.city,
        country: venueData.country,
        location: venueData.location,
        logo: venueData.logo,
        active: true,
        lastUpdated: new Date().toISOString(),
      })

      // Success! Show success message and redirect to dashboard
      setMessage(
        '¡Registro exitoso! Redirigiendo al panel...',
      )

      // Wait a moment to ensure Firestore operations are complete
      setTimeout(() => {
        try {
          // Force page reload to ensure auth state is recognized
          window.location.href = '/dashboard'
        } catch (navError) {
          // Direct fallback
          window.location.href = '/dashboard'
        }
      }, 1000)
    } catch (error) {
      setError(`Error en el registro: ${error.message}`)

      // Clean up any created resources if we have a user
      if (userCredential && userCredential.user) {
        try {
          const venueId = userCredential.user.uid

          // 1. Try to delete the venues document if it was created
          try {
            const venueRef = doc(db, 'venues', venueId)
            await deleteDoc(venueRef)
          } catch (cleanupError) {}

          // Try to delete the venues_locations document if it was created
          try {
            const locationRef = doc(
              db,
              'venues_locations',
              venueId,
            )
            await deleteDoc(locationRef)
          } catch (cleanupError) {}

          // 3. Delete the Firebase user
          await userCredential.user.delete()
        } catch (cleanupError) {}
      }
    } finally {
      setRegisterLoading(false)
    }
  }

  useEffect(() => {
    if (repeatPassword) {
      setPasswordsMatch(password === repeatPassword)
    } else {
      setPasswordsMatch(true)
    }
  }, [password, repeatPassword])

  return (
    <>
      <Spot colorName={'Indigo'} />
      <Spot colorName={'GoldenRod'} />
      <Spot colorName={'MediumVioletRed'} />
      <Spot colorName={'DarkKhaki'} />
      <Spot colorName={'DarkOrchid'} />
      <div className='max-w-xl mx-auto mt-24 mb-24 p-8 bg-white rounded-lg shadow-md overflow-hidden'>
        <h2 className='text-2xl font-bold mb-6 text-center'>
          Crear cuenta
        </h2>
        {error && (
          <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4'>
            {error}
          </div>
        )}
        {message && (
          <div className='mt-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded'>
            {message}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          {/* Name */}
          <div className='mb-4'>
            <label
              htmlFor='name'
              className='block text-gray-700 font-bold mb-2'
            >
              Nombre del sitio
            </label>
            <input
              type='text'
              id='name'
              name='name'
              className='w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500'
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          {/* Logo */}
          <div className='mb-4'>
            <label
              htmlFor='logo'
              className='block text-gray-700 font-bold mb-2'
            >
              Logo
            </label>
            <div className='flex items-center gap-2'>
              <input
                type='file'
                id='logo'
                name='logo'
                accept='image/*'
                onChange={(e) => {
                  const file = e.target.files[0]
                  if (file) {
                    setLogo(file)
                  }
                }}
                className='appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline'
              />
              {logo && (
                <Image
                  src={URL.createObjectURL(logo)}
                  alt='Logo'
                  className='w-12 h-12 rounded-full'
                  width={64}
                  height={64}
                />
              )}
            </div>
          </div>
          {/* Description */}
          <div className='mb-4'>
            <label
              htmlFor='description'
              className='block text-gray-700 font-bold mb-2'
            >
              Descripción del sitio
            </label>
            <textarea
              className='w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500'
              value={description}
              name='description'
              onChange={(e) => {
                const newValue = e.target.value
                if (
                  newValue.length <= DESCRIPTION_MAX_LENGTH
                ) {
                  setDescription(newValue)
                  setDescriptionCharsLeft(
                    DESCRIPTION_MAX_LENGTH -
                      newValue.length,
                  )
                }
              }}
              required
              placeholder='Una breve presentación, una invitación, una descripción de la identidad del lugar...'
              rows='3'
              maxLength={DESCRIPTION_MAX_LENGTH}
            />
            <p className='text-sm text-gray-500 mt-1 text-right'>
              {descriptionCharsLeft} caracteres restantes
            </p>
          </div>
          {/* Country Selection */}
          <div className='mb-4'>
            <label
              htmlFor='country'
              className='block text-gray-700 font-bold mb-2'
            >
              País
            </label>
            <select
              id='country'
              name='country'
              className='w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--teal-500)] bg-[--white]'
              value={selectedCountry}
              onChange={handleCountryChange}
              required
            >
              <option value=''>Selecciona un país</option>
              {Object.keys(countriesAndCities).map(
                (country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ),
              )}
            </select>
          </div>
          {/* City Selection - only render client-side */}
          {isClientSide && (
            <div
              className='mb-4'
              style={{
                display: selectedCountry ? 'block' : 'none',
              }}
            >
              <label
                htmlFor='city'
                className='block text-gray-700 font-bold mb-2'
              >
                Ciudad
              </label>
              <select
                id='city'
                name='city'
                className='w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--teal-500)] bg-[--white]'
                value={selectedCity}
                onChange={(e) =>
                  setSelectedCity(e.target.value)
                }
                disabled={!selectedCountry}
                required
              >
                <option value=''>
                  Selecciona una ciudad
                </option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          )}
          {/* Address */}
          <div className='mb-4'>
            <label
              htmlFor='address'
              className='block text-gray-700 font-bold mb-2'
            >
              Nombre de la dirección
            </label>
            <input
              type='text'
              id='address'
              name='address'
              className='w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500'
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              placeholder='Ej. Calle ABC, #123, zona 1'
            />
          </div>
          {/* Capacity */}
          <div className='mb-4'>
            <label
              htmlFor='capacity'
              className='block text-gray-700 font-bold mb-2'
            >
              Capacidad máxima (opcional)
            </label>
            <input
              id='capacity'
              name='capacity'
              type='number'
              min='1'
              max='99999'
              className=' px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500'
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder='Ej. 200'
              autoComplete='off'
            />
          </div>
          {/* Facebook URL */}
          <div className='mb-4'>
            <label
              htmlFor='facebookUrl'
              className='block text-gray-700 font-bold mb-2'
            >
              Página de Facebook (Opcional)
            </label>
            <input
              id='facebookUrl'
              name='facebookUrl'
              type='url'
              placeholder='https://facebook.com/nombre_de_usuario'
              value={facebookUrl}
              onChange={(e) =>
                setFacebookUrl(e.target.value)
              }
              className='w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none'
            />
          </div>
          {/* Instagram URL */}
          <div className='mb-4'>
            <label
              htmlFor='instagramUrl'
              className='block text-gray-700 font-bold mb-2'
            >
              Perfil de Instagram (Opcional)
            </label>
            <input
              id='instagramUrl'
              name='instagramUrl'
              type='url'
              placeholder='https://instagram.com/nombre_de_usuario'
              value={instagramUrl}
              onChange={(e) =>
                setInstagramUrl(e.target.value)
              }
              className='w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none'
            />
          </div>
          {/* WhatsApp Number */}
          <div className='mb-4'>
            <label
              htmlFor='whatsappNumber'
              className='block text-gray-700 font-bold mb-2'
            >
              Número de WhatsApp (Opcional)
            </label>
            <input
              id='whatsappNumber'
              name='whatsappNumber'
              type='tel' // Use type 'tel' for phone numbers
              placeholder='+1234567890 (Incluir código de país)'
              value={whatsappNumber}
              onChange={(e) =>
                setWhatsappNumber(e.target.value)
              }
              className='w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none'
            />
            <p className='mt-1 text-xs text-gray-500'>
              Incluye el código de país (ej. +591 para
              Bolivia).
            </p>
          </div>
          {/* Amenities */}
          <div className='mb-4'>
            <label className='block text-gray-700 font-bold mb-2'>
              Servicios y comodidades (opcional)
            </label>
            <div className='grid grid-cols-2 gap-3'>
              {AMENITIES_OPTIONS.map((amenity) => (
                <label
                  key={amenity}
                  className={`flex items-center space-x-2 p-2 border rounded-lg hover:bg-[#1e40af20] cursor-pointer transition-colors duration-200 ${
                    selectedAmenities.includes(amenity)
                      ? 'bg-[#1e40af20]'
                      : ''
                  }`}
                >
                  <input
                    type='checkbox'
                    value={amenity}
                    checked={selectedAmenities.includes(
                      amenity,
                    )}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedAmenities([
                          ...selectedAmenities,
                          amenity,
                        ])
                      } else {
                        setSelectedAmenities(
                          selectedAmenities.filter(
                            (a) => a !== amenity,
                          ),
                        )
                      }
                    }}
                    className='form-checkbox h-4 w-4'
                  />
                  <span className='text-gray-700'>
                    {amenity}
                  </span>
                </label>
              ))}
            </div>
          </div>
          {/* Map Location */}
          <div className='mb-4 h-[300px]'>
            <label className='block text-gray-700 font-bold mb-2'>
              Ubicación{' '}
              <span className='text-gray-500 text-sm'>
                (selecciona el punto exacto de entrada)
              </span>
            </label>
            <div className='h-full pb-8'>
              <MapComponent
                center={[-17.389499, -66.156123]}
                zoom={12}
                isEditable={true}
                registrationAddress={getFirstTwoWords(
                  address,
                )}
                registrationCity={selectedCity}
                onLocationSelect={(location) =>
                  setGeoPoint(location)
                }
                venues={
                  geoPoint.lat && geoPoint.lng
                    ? [
                        {
                          name: name || 'Nuevo espacio',
                          location: {
                            latitude: geoPoint.lat,
                            longitude: geoPoint.lng,
                          },
                        },
                      ]
                    : []
                }
              />
            </div>
          </div>
          {/* Photos Upload */}
          <div className='mb-4'>
            <label
              htmlFor='photos'
              className='block text-gray-700 font-bold mb-2'
            >
              Imágenes{' '}
              <span className='text-gray-500 text-sm'>
                (máximo {MAX_PHOTOS})
              </span>
            </label>
            <input
              type='file'
              id='photos'
              accept='image/*'
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files)

                if (files.length > MAX_PHOTOS) {
                  setMessage(
                    `Solo puedes subir hasta ${MAX_PHOTOS} fotos.`,
                  )
                  e.target.value = ''
                  return
                }

                setPhotos(files)
                setMessage('')
              }}
              className='appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline'
            />

            {message && (
              <p className='text-red-500'>{message}</p>
            )}
          </div>
          {/* Email */}
          <div className='mb-4'>
            <label
              htmlFor='email'
              className='block text-gray-700 font-bold mb-2'
            >
              Correo electrónico
            </label>
            <input
              type='email'
              id='email'
              className='w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          {/* Password */}
          <div className='mb-4'>
            <label
              htmlFor='password'
              className='block text-gray-700 font-bold mb-2'
            >
              Contraseña
            </label>
            <input
              type='password'
              id='password'
              className='w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <p className='text-sm text-gray-500 mt-1'>
              La contraseña debe tener al menos 6 caracteres
              y una letra mayúscula
            </p>
          </div>
          {/* Repeat Password */}
          <div className='mb-6'>
            <label
              htmlFor='repeatPassword'
              className='block text-gray-700 font-bold mb-2'
            >
              Repetir contraseña
            </label>
            <div className='relative'>
              <input
                type='password'
                id='repeatPassword'
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  passwordsMatch
                    ? 'focus:ring-teal-500'
                    : 'focus:ring-red-500 border-red-300'
                }`}
                value={repeatPassword}
                onChange={(e) => {
                  setRepeatPassword(e.target.value)
                }}
                required
              />
              {repeatPassword && (
                <div className='absolute right-3 top-1/2 transform -translate-y-1/2'>
                  {passwordsMatch ? (
                    <svg
                      className='w-5 h-5 text-green-500'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth='2'
                        d='M5 13l4 4L19 7'
                      ></path>
                    </svg>
                  ) : (
                    <svg
                      className='w-5 h-5 text-red-500'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth='2'
                        d='M6 18L18 6M6 6l12 12'
                      ></path>
                    </svg>
                  )}
                </div>
              )}
            </div>
            {!passwordsMatch && repeatPassword && (
              <p className='text-sm text-red-500 mt-1'>
                Las contraseñas no coinciden
              </p>
            )}
          </div>
          <button
            type='submit'
            className='w-full bg-teal-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-teal-600 transition duration-300 disabled:opacity-70'
            disabled={registerLoading}
          >
            {registerLoading
              ? 'Procesando...'
              : 'Registrarse'}
          </button>
        </form>
        <p className='mt-4 text-center'>
          ¿Ya tienes una cuenta?{' '}
          <Link
            className='text-teal-600 hover:underline'
            href='/login'
          >
            Inicia sesión aquí
          </Link>
        </p>
      </div>
    </>
  )
}

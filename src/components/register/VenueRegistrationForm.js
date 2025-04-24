'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { onAuthStateChanged } from 'firebase/auth'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { FaEye, FaEyeSlash } from 'react-icons/fa'
import {
  auth,
  db,
  storage,
} from '../../lib/firebase-client' // Adjust path as needed
import {
  doc,
  GeoPoint,
  setDoc,
  deleteDoc,
} from 'firebase/firestore'
import MapComponent from '../map/MapComponent' // Adjust path as needed
import {
  getDownloadURL,
  ref,
  uploadBytes,
} from 'firebase/storage'
import Image from 'next/image'
import {
  AMENITIES_OPTIONS,
  COUNTRIES_AND_CITIES,
} from '../../lib/constants' // Adjust path as needed
import {
  compressImage,
  compressMultipleImages,
  validateFacebookUrl,
  validateInstagramUrl,
  validateWhatsappNumber,
} from '../../lib/utils' // Adjust path as needed

// Define constants for form limits
const DESCRIPTION_MAX_LENGTH = 500
const MAX_PHOTOS = 5

const VenueRegistrationForm = ({}) => {
  // --- State Variables ---
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
  const [showPassword, setShowPassword] = useState(false)
  const [showRepeatPassword, setShowRepeatPassword] =
    useState(false)
  const router = useRouter()

  // --- Effects ---
  useEffect(() => {
    setIsClientSide(true)
  }, [])

  // Redirect authenticated users
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in, redirect them to the dashboard.
        router.push('/dashboard')
      }
      // If user is null, they are not signed in, so stay on the register page.
    })

    // Cleanup subscription on unmount
    return () => unsubscribe()
  }, [router])

  // Check if passwords match
  useEffect(() => {
    if (repeatPassword) {
      setPasswordsMatch(password === repeatPassword)
    } else {
      setPasswordsMatch(true)
    }
  }, [password, repeatPassword])

  // --- Handlers & Logic ---
  const handleCountryChange = (e) => {
    const country = e.target.value
    setSelectedCountry(country)
    setCities(COUNTRIES_AND_CITIES[country] || [])
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
        active: true, // Venues are active by default upon registration
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
        active: true, // Also active here
        lastUpdated: new Date().toISOString(),
      })

      // Success! Show success message and redirect to dashboard
      setMessage(
        '¡Registro exitoso! Redirigiendo al panel...',
      )

      // Wait a moment to ensure Firestore operations are complete
      setTimeout(() => {
        router.push('/dashboard')
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

          // 2. Try to delete the venues_locations document if it was created
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

  return (
    <>
      {/* Display Error/Success Messages */}
      {error && (
        <div className='mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded'>
          {error}
        </div>
      )}
      {message && (
        <div className='mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded'>
          {message}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        {/* Name */}
        <div className='mb-4'>
          <label
            htmlFor='name'
            className='block text-gray-700 font-bold mb-2 '
          >
            Nombre del sitio
          </label>
          <div className='relative'>
            <input
              type='text'
              id='name'
              name='name'
              className='w-full px-3 py-2 pr-8 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500'
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            {name && (
              <button
                type='button'
                onClick={() => setName('')}
                className='absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600'
                aria-label='Clear name input'
              >
                &#x2715;
              </button>
            )}
          </div>
        </div>
        {/* Logo */}
        <div className='mb-4'>
          <label
            htmlFor='logo'
            className='block text-gray-700 font-bold mb-2 '
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
            className='block text-gray-700 font-bold mb-2 '
          >
            Descripción del sitio
          </label>
          <div className='relative'>
            <textarea
              className='w-full px-3 py-2 pr-8 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500'
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
            {description && (
              <button
                type='button'
                onClick={() => {
                  setDescription('')
                  setDescriptionCharsLeft(
                    DESCRIPTION_MAX_LENGTH,
                  )
                }}
                className='absolute right-2 top-2.5 text-gray-400 hover:text-gray-600'
                aria-label='Clear description input'
              >
                &#x2715;
              </button>
            )}
          </div>
          <p className=' text-gray-500 mt-1 text-right'>
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
            {Object.keys(COUNTRIES_AND_CITIES).map(
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
          <div className='relative'>
            <input
              type='text'
              id='address'
              name='address'
              className='w-full px-3 py-2 pr-8 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500'
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              placeholder='Ej. Calle ABC, #123, zona 1'
            />
            {address && (
              <button
                type='button'
                onClick={() => setAddress('')}
                className='absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600'
                aria-label='Clear address input'
              >
                &#x2715;
              </button>
            )}
          </div>
        </div>
        {/* Capacity */}
        <div className='mb-4'>
          <label
            htmlFor='capacity'
            className='block text-gray-700 font-bold mb-2'
          >
            Capacidad máxima (opcional)
          </label>
          <div className='relative inline-block'>
            <input
              id='capacity'
              name='capacity'
              type='number'
              min='1'
              max='99999'
              className='px-3 py-2 pr-8 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500'
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder='Ej. 200'
              autoComplete='off'
            />
            {capacity && (
              <button
                type='button'
                onClick={() => setCapacity('')}
                className='absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600'
                aria-label='Clear capacity input'
              >
                &#x2715;
              </button>
            )}
          </div>
        </div>
        {/* Facebook URL */}
        <div className='mb-4'>
          <label
            htmlFor='facebookUrl'
            className='block text-gray-700 font-bold mb-2'
          >
            Página de Facebook (Opcional)
          </label>
          <div className='relative'>
            <input
              id='facebookUrl'
              name='facebookUrl'
              type='url'
              placeholder='https://facebook.com/nombre_de_usuario'
              value={facebookUrl}
              onChange={(e) =>
                setFacebookUrl(e.target.value)
              }
              className='w-full p-2 pr-8 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none'
            />
            {facebookUrl && (
              <button
                type='button'
                onClick={() => setFacebookUrl('')}
                className='absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600'
                aria-label='Clear Facebook URL input'
              >
                &#x2715;
              </button>
            )}
          </div>
        </div>
        {/* Instagram URL */}
        <div className='mb-4'>
          <label
            htmlFor='instagramUrl'
            className='block text-gray-700 font-bold mb-2'
          >
            Perfil de Instagram (Opcional)
          </label>
          <div className='relative'>
            <input
              id='instagramUrl'
              name='instagramUrl'
              type='url'
              placeholder='https://instagram.com/nombre_de_usuario'
              value={instagramUrl}
              onChange={(e) =>
                setInstagramUrl(e.target.value)
              }
              className='w-full p-2 pr-8 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none'
            />
            {instagramUrl && (
              <button
                type='button'
                onClick={() => setInstagramUrl('')}
                className='absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600'
                aria-label='Clear Instagram URL input'
              >
                &#x2715;
              </button>
            )}
          </div>
        </div>
        {/* WhatsApp Number */}
        <div className='mb-4'>
          <label
            htmlFor='whatsappNumber'
            className='block text-gray-700 font-bold mb-2'
          >
            Número de WhatsApp (Opcional)
          </label>
          <div className='relative'>
            <input
              id='whatsappNumber'
              name='whatsappNumber'
              type='number'
              placeholder='+1234567890 (Incluir código de país)'
              value={whatsappNumber}
              onChange={(e) =>
                setWhatsappNumber(e.target.value)
              }
              className='w-full p-2 pr-8 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none'
            />
            {whatsappNumber && (
              <button
                type='button'
                onClick={() => setWhatsappNumber('')}
                className='absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600'
                aria-label='Clear WhatsApp number input'
              >
                &#x2715;
              </button>
            )}
          </div>
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
              registrationAddress={address}
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
          <div className='relative'>
            <input
              type='email'
              id='email'
              className='w-full px-3 py-2 pr-8 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {email && (
              <button
                type='button'
                onClick={() => setEmail('')}
                className='absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600'
                aria-label='Clear email input'
              >
                &#x2715;
              </button>
            )}
          </div>
        </div>
        {/* Password */}
        <div className='mb-4'>
          <label
            htmlFor='password'
            className='block text-gray-700 font-bold mb-2 '
          >
            Contraseña
          </label>
          <div className='relative'>
            <input
              type={showPassword ? 'text' : 'password'}
              id='password'
              className='w-full px-3 py-2 pr-16 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {password && (
              <button
                type='button'
                onClick={() => setPassword('')}
                className='absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600'
                aria-label='Clear password input'
              >
                &#x2715;
              </button>
            )}
            <button
              type='button'
              onClick={() => setShowPassword(!showPassword)}
              className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600'
              aria-label={
                showPassword
                  ? 'Hide password'
                  : 'Show password'
              }
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          <p className='text-xs text-gray-500 mt-1'>
            La contraseña debe tener al menos 6 caracteres y
            una letra mayúscula
          </p>
        </div>
        {/* Repeat Password */}
        <div className='mb-6'>
          <label
            htmlFor='repeatPassword'
            className='block text-gray-700 font-bold mb-2 '
          >
            Repetir contraseña
          </label>
          <div className='relative'>
            <input
              type={
                showRepeatPassword ? 'text' : 'password'
              }
              id='repeatPassword'
              className={`w-full px-3 py-2 pr-20 border rounded-lg focus:outline-none focus:ring-2 ${
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
              <button
                type='button'
                onClick={() => setRepeatPassword('')}
                className='absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600'
                aria-label='Clear repeat password input'
              >
                &#x2715;
              </button>
            )}
            {repeatPassword && (
              <button
                type='button'
                onClick={() =>
                  setShowRepeatPassword(!showRepeatPassword)
                }
                className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600'
                aria-label={
                  showRepeatPassword
                    ? 'Hide repeat password'
                    : 'Show repeat password'
                }
              >
                {showRepeatPassword ? (
                  <FaEyeSlash />
                ) : (
                  <FaEye />
                )}
              </button>
            )}
          </div>
          {!passwordsMatch && repeatPassword && (
            <p className=' text-red-500 mt-1'>
              Las contraseñas no coinciden
            </p>
          )}
        </div>
        {/* Register Button */}
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
    </>
  )
}

export default VenueRegistrationForm

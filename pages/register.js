'use client'

import Layout from '../components/Layout'
import { useEffect, useState } from 'react'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { auth, db, storage } from '../lib/firebase-client'
import { doc, GeoPoint, setDoc } from 'firebase/firestore'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Spot from '../components/Spot'
import MapComponent from '../components/MapComponent'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'

const AMENITIES_OPTIONS = [
  'Parking',
  'Bar',
  'Escenario',
  'Snacks',
  'Comida',
  'Acceso discapacitados',
  'Wi-Fi',
]

export default function Register () {
  const [name, setName] = useState( '' )
  const [email, setEmail] = useState( '' )
  const [description, setDescription] = useState( '' )
  const [address, setAddress] = useState( '' )
  const [capacity, setCapacity] = useState( 1 )
  const [geoPoint, setGeoPoint] = useState( { lat: null, lng: null } );
  const [selectedAmenities, setSelectedAmenities] = useState( [] )
  const [password, setPassword] = useState( '' )
  const [repeatPassword, setRepeatPassword] = useState( '' )
  const [images, setImages] = useState( [] )
  const [error, setError] = useState( '' )
  const router = useRouter()

  const validatePassword = ( password ) => {
    if ( password.length < 6 ) {
      return 'La contraseña debe tener al menos 6 caracteres'
    }
    if ( !/[A-Z]/.test( password ) ) {
      return 'La contraseña debe contener al menos una letra mayúscula'
    }
    return ''
  }

  const uploadImages = async ( images, venueId ) => {
    const urls = [];
    for ( const image of images ) {
      const storageRef = ref( storage, `venues/${venueId}/${image.name}` );
      await uploadBytes( storageRef, image );
      const url = await getDownloadURL( storageRef );
      urls.push( url );
    }
    return urls;
  };

  const handleSubmit = async ( e ) => {
    e.preventDefault()
    const passwordError = validatePassword( password )
    if ( passwordError ) {
      setError( passwordError )
      return
    }
    if ( password !== repeatPassword ) {
      setError( 'Las contraseñas no coinciden' )
      return
    }

    try {
      // Create a new user with email and password
      const userCredential =
        await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        )

      // Create a user document in Firestore
      await setDoc(
        doc( db, 'venues', userCredential.user.uid ),
        {
          name,
          email,
          description,
          address,
          capacity: Number( capacity ),
          location: new GeoPoint( geoPoint.lat, geoPoint.lng ),
          amenities: selectedAmenities,
          images: await uploadImages( images, userCredential.user.uid ),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      )

      // Upload images to Storage
      await uploadImages( images, userCredential.user.uid )

      router.push( '/dashboard' )
    } catch ( error ) {
      setError( error.message )
    }
  }

  return (
    <Layout>
      <Spot colorName={'Indigo'} />
      <Spot colorName={'GoldenRod'} />
      <Spot colorName={'MediumVioletRed'} />
      <Spot colorName={'DarkKhaki'} />
      <Spot colorName={'DarkOrchid'} />
      <div className='mx-auto mt-14 container'>
        <div className='max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden'>
          <div className='p-6'>
            <h2 className='text-2xl font-bold mb-6 text-center'>
              Crear cuenta
            </h2>
            {error && (
              <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4'>
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit}>
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
                  className='w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500'
                  value={name}
                  onChange={( e ) => setName( e.target.value )}
                  required
                />
              </div>
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
                  onChange={( e ) => setEmail( e.target.value )}
                  required
                />
              </div>
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
                  onChange={( e ) => setDescription( e.target.value )}
                  required
                  placeholder='Una breve presentación, una invitación, una descripción de la identidad del lugar...'
                  rows='3'
                />
              </div>
              <div className='mb-4'>
                <label
                  htmlFor='address'
                  className='block text-gray-700 font-bold mb-2'
                >
                  Dirección completa
                </label>
                <input
                  type='text'
                  id='address'
                  className='w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500'
                  value={address}
                  onChange={( e ) => setAddress( e.target.value )}
                  required
                  placeholder='Ej. Calle 123, zona 1, a lado del parque'
                />
              </div>
              <div className='mb-4'>
                <label
                  htmlFor='capacity'
                  className='block text-gray-700 font-bold mb-2'
                >
                  Capacidad máxima (opcional)
                </label>
                <input
                  type='number'
                  min='1'
                  max='9999'
                  id='capacity'
                  className=' px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500'
                  value={capacity}
                  onChange={( e ) => setCapacity( e.target.value )}
                  placeholder='Ej. 200'
                />
              </div>
              <div className='mb-4'>
                <label className='block text-gray-700 font-bold mb-2'>
                  Servicios y comodidades
                </label>
                <div className='grid grid-cols-2 gap-3'>
                  {AMENITIES_OPTIONS.map( ( amenity ) => (
                    <label
                      key={amenity}
                      className={`flex items-center space-x-2 p-2 border rounded-lg hover:bg-[#1e40af20] cursor-pointer transition-colors duration-200 ${selectedAmenities.includes( amenity ) ? 'bg-[#1e40af20]' : ''
                        }`}
                    >
                      <input
                        type='checkbox'
                        value={amenity}
                        checked={selectedAmenities.includes( amenity )}
                        onChange={( e ) => {
                          if ( e.target.checked ) {
                            setSelectedAmenities( [...selectedAmenities, amenity] )
                          } else {
                            setSelectedAmenities( selectedAmenities.filter( a => a !== amenity ) )
                          }
                        }}
                        className='form-checkbox h-4 w-4'
                      />
                      <span className='text-gray-700'>{amenity}</span>
                    </label>
                  ) )}
                </div>
              </div>
              <div className="mb-4 h-[200px]">
                <label className='block text-gray-700 font-bold mb-2'>
                  Ubicación <span className='text-gray-500 text-sm'>(selecciona el punto exacto)</span>
                </label>
                <div className="h-full pb-8">
                  <MapComponent
                    center={[-17.389499, -66.156123]}
                    zoom={14}
                    onLocationSelect={( location ) => setGeoPoint( location )}
                    venues={[{
                      displayName: name,
                      geopoint: geoPoint
                    }]}
                  />
                </div>
              </div>
              <div className="mb-4">
                <label htmlFor="images" className="block text-gray-700 font-bold mb-2">
                  Imágenes <span className="text-gray-500 text-sm">(máximo 3)</span>
                </label>
                <input
                  type="file"
                  id="images"
                  accept="image/*"
                  multiple
                  onChange={( e ) => {
                    const files = Array.from( e.target.files ).slice( 0, 3 );
                    setImages( files );
                  }}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
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
                  onChange={( e ) => setPassword( e.target.value )}
                  required
                />
                <p className='text-sm text-gray-500 mt-1'>
                  La contraseña debe tener al menos 6 caracteres y una letra
                  mayúscula
                </p>
              </div>
              <div className='mb-6'>
                <label
                  htmlFor='repeatPassword'
                  className='block text-gray-700 font-bold mb-2'
                >
                  Repetir contraseña
                </label>
                <input
                  type='password'
                  id='repeatPassword'
                  className='w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500'
                  value={repeatPassword}
                  onChange={( e ) => setRepeatPassword( e.target.value )}
                  required
                />
              </div>
              <button
                type='submit'
                className='w-full bg-teal-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-teal-600 transition duration-300'
              >
                Registrarse
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
        </div>
      </div>
    </Layout>
  )
}

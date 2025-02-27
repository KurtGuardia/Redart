'use client'

import Layout from '../components/Layout'
import { useState } from 'react'
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth'
import { auth, db } from './_app'
import { doc, setDoc } from 'firebase/firestore'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Spot from '../components/Spot'

export default function Register () {
  const [name, setName] = useState( '' )
  const [email, setEmail] = useState( '' )
  const [password, setPassword] = useState( '' )
  const [error, setError] = useState( null )
  const router = useRouter()

  const handleSubmit = async ( e ) => {
    e.preventDefault()
    try {
      const userCredential =
        await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        )
      await updateProfile( userCredential.user, {
        displayName: name,
      } )

      // Create a user document in Firestore
      await setDoc(
        doc( db, 'users', userCredential.user.uid ),
        {
          name,
          email,
          createdAt: new Date().toISOString(),
        },
      )

      router.push( '/dashboard' )
    } catch ( error ) {
      setError( error.message )
    }
  }

  return (
    <Layout>
      <Spot colorName={'GoldenRod'} />
      <Spot colorName={'MediumVioletRed'} />
      <Spot colorName={'DarkKhaki'} />
      <Spot colorName={'DarkOrchid'} />
      <div className='my-40 container px-4 py-8'>
        <div className='max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden'>
          <div className='p-6'>
            <h2 className='text-2xl font-bold mb-6 text-center'>
              Crear cuenta
            </h2>
            {error && (
              <p className='text-red-500 mb-4'>{error}</p>
            )}
            <form onSubmit={handleSubmit}>
              <div className='mb-4'>
                <label
                  htmlFor='name'
                  className='block text-gray-700 font-bold mb-2'
                >
                  Nombre completo
                </label>
                <input
                  type='text'
                  id='name'
                  value={name}
                  onChange={( e ) => setName( e.target.value )}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500'
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
                  value={email}
                  onChange={( e ) => setEmail( e.target.value )}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500'
                  required
                />
              </div>
              <div className='mb-6'>
                <label
                  htmlFor='password'
                  className='block text-gray-700 font-bold mb-2'
                >
                  Contraseña
                </label>
                <input
                  type='password'
                  id='password'
                  value={password}
                  onChange={( e ) =>
                    setPassword( e.target.value )
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500'
                  required
                />
              </div>
              <button
                type='submit'
                className='w-full bg-teal-600 text-white py-2 px-4 rounded-md hover:bg-teal-700 transition duration-300'
              >
                Registrarse
              </button>
            </form>
            <p className='mt-4 text-center'>
              ¿Ya tienes una cuenta?{' '}
              <Link
                href='/login'
                className='text-teal-600 hover:underline'
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

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useUserData } from '../../hooks/useUserData'
import { translateFirebaseAuthError } from '../../lib/firebaseErrors' // Import the translator

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { userId, loading: userLoading } = useUserData()

  useEffect(() => {
    if (!userLoading && userId) {
      console.log(
        'User already logged in, redirecting to dashboard...',
      )
      const redirect =
        searchParams.get('redirect') || '/dashboard'
      router.push(redirect)
    }
  }, [userId, userLoading, router, searchParams])

  if (userLoading || userId)
    return (
      <div className='relative flex flex-col items-center p-4 xl:p-20'>
        {/* Pulsing circle */}
        <div className='absolute inset-0 flex items-center justify-center'>
          <div
            className='absolute rounded-full bg-gradient-to-r from-teal-500 to-blue-500 opacity-70 animate-ping'
            style={{ width: '150px', height: '150px' }}
          ></div>
        </div>

        {/* Spinning circle */}
        <div className='relative m-auto w-40 h-40 mb-8'>
          <div className='absolute inset-0 rounded-full border-8 border-transparent border-t-teal-500 border-b-blue-500 animate-spin'></div>
          <div
            className='absolute inset-2 rounded-full border-8 border-transparent border-r-teal-300 border-l-blue-300 animate-spin'
            style={{
              animationDirection: 'reverse',
              animationDuration: '1.5s',
            }}
          ></div>

          {/* Center emblem */}
          <div className='absolute inset-0 flex items-center justify-center'>
            <div className='bg-white rounded-full w-20 h-20 flex items-center justify-center shadow-lg shadow-teal-500/20'>
              <span className='text-3xl font-bold bg-gradient-to-r from-teal-500 to-blue-500 text-transparent bg-clip-text'>
                R
              </span>
            </div>
          </div>
        </div>
      </div>
    )

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const { signInWithEmailAndPassword } = await import(
        'firebase/auth'
      )
      const { auth } = await import(
        '../../lib/firebase-client'
      )

      await signInWithEmailAndPassword(
        auth,
        email,
        password,
      )
      await auth.authStateReady()
      const redirect =
        searchParams.get('redirect') || '/dashboard'
      router.push(redirect)
    } catch (error) {
      setError(translateFirebaseAuthError(error.code)) // Use the translator
      console.error(
        'Login error:',
        error.code,
        error.message,
      )
    }
  }

  return (
    <div className='p-6'>
      <h2 className='text-2xl font-bold mb-6 text-center'>
        Iniciar sesión
      </h2>
      <form onSubmit={handleSubmit}>
        <div className='mb-5'>
          {' '}
          {/* Increased margin slightly */}
          <label
            htmlFor='email'
            className='block text-gray-700 font-bold mb-2 text-lg'
          >
            Correo electrónico
          </label>
          <input
            type='email'
            id='email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500'
            required
          />
        </div>
        <div className='mb-5'>
          {' '}
          {/* Increased margin slightly */}
          <label
            htmlFor='password'
            className='block text-gray-700 font-bold mb-2 text-lg'
          >
            Contraseña
          </label>
          <input
            type='password'
            id='password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500'
            required
          />
        </div>
        {/* Error message moved here */}
        {error && (
          <p className='text-red-600 text-center text-lg mb-4'>
            {error}
          </p>
        )}
        <button
          type='submit'
          className='w-full bg-teal-600 text-white py-2 px-4 rounded-md hover:bg-teal-700 transition duration-300'
        >
          Iniciar sesión
        </button>
      </form>
      <p className='mt-4 text-xl'>
        ¿No tienes una cuenta? | {''}
        <Link
          className='text-teal-600 hover:underline'
          href='/register'
        >
          Regístrate aquí
        </Link>
      </p>
    </div>
  )
}

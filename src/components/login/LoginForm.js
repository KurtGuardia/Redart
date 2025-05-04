'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useUserData } from '../../hooks/useUserData'
import { FaEye, FaEyeSlash } from 'react-icons/fa' // Import eye icons
import { translateFirebaseAuthError } from '../../lib/firebaseErrors' // Import the translator

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const router = useRouter()
  const [loginLoading, setLoginLoading] = useState(false) // State for login process
  const [showPassword, setShowPassword] = useState(false) // State for password visibility
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
    setLoginLoading(true) // Start loading
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
    } finally {
      setLoginLoading(false) // Stop loading regardless of outcome
    }
  }

  return (
    <div className='p-6'>
      <h2 className='text-2xl font-bold mb-6 text-center'>
        Iniciar sesión
      </h2>
      <form onSubmit={handleSubmit}>
        <label
          htmlFor='email'
          className='block text-gray-700 font-bold mb-2 text-lg'
        >
          Correo electrónico
        </label>
        <div className='relative mb-10'>
          <input
            aria-label='Correo electrónico'
            type='email'
            id='email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className='w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500' // Added pr-10, changed to rounded-lg
            required
            autoComplete='email'
          />
          {email && (
            <button
              type='button'
              onClick={() => setEmail('')} // Centered vertically
              className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600'
              aria-label='Clear email input'
            >
              &#x2715; {/* Multiplication X sign */}
            </button>
          )}
        </div>
        {/* Password input */}{' '}
        <label
          htmlFor='password'
          className='block text-gray-700 font-bold mb-2 text-lg'
        >
          Contraseña
        </label>
        <div className='relative mb-10'>
          <input
            aria-label='Contraseña'
            type={showPassword ? 'text' : 'password'} // Toggle type
            id='password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className='w-full px-3 py-2 pr-16 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500' // Added pr-16, changed to rounded-lg
            required
            autoComplete='current-password'
          />
          {/* Container for password icons */}
          <div className='absolute inset-y-0 right-0 pr-3 flex items-center space-x-2'>
            {password && (
              <button
                type='button'
                onClick={() => setPassword('')}
                className='text-gray-400 hover:text-gray-600' // Removed absolute positioning
                aria-label='Clear password input'
              >
                &#x2715; {/* Multiplication X sign */}
              </button>
            )}
            <button
              type='button'
              onClick={() => setShowPassword(!showPassword)}
              className='text-gray-400 hover:text-gray-600' // Removed absolute positioning
              aria-label={
                showPassword
                  ? 'Hide password'
                  : 'Show password'
              }
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>
        {/* Error message moved here */}
        {error && (
          <p className='text-red-600 text-center text-lg mb-4'>
            {error}
          </p>
        )}
        <button
          type='submit'
          className='w-full bg-teal-600 text-white py-2 px-4 rounded-lg hover:bg-teal-700 transition duration-300 disabled:opacity-70 disabled:cursor-not-allowed' // Changed to rounded-lg
          disabled={loginLoading} // Disable button when loading
        >
          {loginLoading ? 'Iniciando...' : 'Iniciar sesión'}
        </button>
      </form>
      <p className='mt-4 text-base lg:text-xl'>
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

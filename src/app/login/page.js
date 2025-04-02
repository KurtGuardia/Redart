'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Spot from '../../components/ui/Spot'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const router = useRouter()
  const searchParams = useSearchParams()

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
      await auth.authStateReady() // Wait for state propagation
      const redirect =
        searchParams.get('redirect') || '/dashboard'
      router.push(redirect)
    } catch (error) {
      setError(error.message)
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
      {error && (
        <p className='text-red-500 mb-4'>{error}</p>
      )}
      <form onSubmit={handleSubmit}>
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
            onChange={(e) => setEmail(e.target.value)}
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
            onChange={(e) => setPassword(e.target.value)}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500'
            required
          />
        </div>
        <button
          type='submit'
          className='w-full bg-teal-600 text-white py-2 px-4 rounded-md hover:bg-teal-700 transition duration-300'
        >
          Iniciar sesión
        </button>
      </form>
      <p className='mt-4 text-center'>
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

//TODO: delete when actual login is implemented
// Loading fallback component
function LoginFormFallback() {
  return (
    <div className='p-6'>
      <h2 className='text-2xl font-bold mb-6 text-center'>
        Cargando...
      </h2>
    </div>
  )
}

export default function Login() {
  return (
    <>
      <Spot colorName={'red'} />
      <Spot colorName={'Indigo'} />
      <Spot colorName={'GoldenRod'} />
      <Spot colorName={'MediumVioletRed'} />
      <div className='mx-auto my-24 container'>
        <div className='max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden'>
          <Suspense fallback={<LoginFormFallback />}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </>
  )
}

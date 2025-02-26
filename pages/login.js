'use client'

import Layout from '../components/Layout'
import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from './_app'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await signInWithEmailAndPassword(
        auth,
        email,
        password,
      )
      router.push('/dashboard')
    } catch (error) {
      setError(error.message)
    }
  }

  return (
    <Layout>
      <div className=' my-40container px-4 py-8'>
        <div className='max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden'>
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
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
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
              ¿No tienes una cuenta?
              <Link
                className='text-teal-600 hover:underline'
                href='/register'
              >
                Regístrate aquí
              </Link>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  )
}

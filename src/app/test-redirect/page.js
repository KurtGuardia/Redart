'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function TestRedirect() {
  const router = useRouter()

  useEffect(() => {
    console.log('Test redirect component mounted')
    try {
      console.log('Attempting to redirect to dashboard...')
      setTimeout(() => {
        router.push('/dashboard')

        // Fallback
        setTimeout(() => {
          console.log('Using fallback redirect method')
          window.location.href = '/dashboard'
        }, 1000)
      }, 500)
    } catch (error) {
      console.error('Error during navigation:', error)
      // Direct fallback
      window.location.href = '/dashboard'
    }
  }, [router])

  return (
    <div className='container mx-auto p-4 text-center'>
      <h1 className='text-2xl font-bold mb-4'>
        Redirecting to Dashboard...
      </h1>
      <p>
        If you are not redirected automatically, click{' '}
        <a
          href='/dashboard'
          className='text-blue-500 underline'
        >
          here
        </a>
        .
      </p>
    </div>
  )
}

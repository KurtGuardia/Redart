'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { auth } from '../lib/firebase-client'

export default function AuthListener() {
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      // Get current path
      const currentPath = window.location.pathname

      // Auth paths where we don't want to redirect to dashboard
      const authPaths = ['/login', '/register']
      const isAuthPath = authPaths.includes(currentPath)

      // Handle authenticated user
      if (user) {
        // If the user is authenticated and on an auth page, redirect to dashboard
        if (isAuthPath) {
          router.push('/dashboard')
        }
      }
      // Handle unauthenticated user
      else if (
        !isAuthPath &&
        currentPath !== '/' &&
        !currentPath.startsWith('/test-redirect')
      ) {
        // Prevent redirect loop by checking if we're not already heading to login
        router.push(
          `/login?redirect=${encodeURIComponent(
            currentPath,
          )}`,
        )
      }
    })

    return () => unsubscribe()
  }, [router])

  return null
}

'use client'

import { useState, useEffect } from 'react'
import { auth } from '../lib/firebase-client' // Adjust path if needed
import { onAuthStateChanged } from 'firebase/auth'

/**
 * Hook to get the current Firebase Authentication user state.
 * Returns the user object (or null) and loading status.
 */
export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser)
        setLoading(false)
      },
    )

    // Cleanup subscription on unmount
    return () => unsubscribe()
  }, []) // Empty dependency array ensures this runs once on mount

  return { user, loadingAuth: loading } // Rename loading to avoid conflicts
}

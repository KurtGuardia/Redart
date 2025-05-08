'use client'

import { useState, useEffect } from 'react'
import { auth, db } from '../lib/firebase-client'
import { doc, getDoc } from 'firebase/firestore'

/**
 * Hook to manage authentication state and fetch initial user/venue role.
 * Fetches detailed data only if the role is 'user'.
 * For 'venue' role, it only identifies the role and provides the ID.
 * Therefore userData will contain full user data OR just { id, role: 'venue' }
 */
export function useUserData() {
  const [userId, setUserId] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(
      async (user) => {
        setLoading(true)
        setUserId(null)
        setUserData(null)
        setError(null)

        if (user) {
          const currentUserId = user.uid
          setUserId(currentUserId)
          try {
            // 1. Check 'users' collection
            const userDocRef = doc(
              db,
              'users',
              currentUserId,
            )
            let attempts = 0
            let userDocSnap = await getDoc(userDocRef)

            // Try up to 3 times if doc doesn't exist
            while (!userDocSnap.exists() && attempts < 3) {
              console.log(
                'User doc not found, retrying...',
                attempts + 1,
              )
              await new Promise((resolve) =>
                setTimeout(resolve, 500),
              )
              userDocSnap = await getDoc(userDocRef)
              attempts++
            }

            if (userDocSnap.exists()) {
              const fetchedUserData = {
                id: userDocSnap.id,
                ...userDocSnap.data(),
              }
              fetchedUserData.role =
                fetchedUserData.role || 'user'

              // Convert User Timestamps
              if (fetchedUserData.createdAt?.toDate) {
                fetchedUserData.createdAt =
                  fetchedUserData.createdAt.toDate()
              }
              if (fetchedUserData.updatedAt?.toDate) {
                fetchedUserData.updatedAt =
                  fetchedUserData.updatedAt.toDate()
              }

              // Process ratings if they exist
              if (Array.isArray(fetchedUserData.ratings)) {
                fetchedUserData.ratings =
                  fetchedUserData.ratings.map((rated) => ({
                    ...rated,
                    updatedAt: rated.updatedAt?.toDate
                      ? rated.updatedAt.toDate()
                      : rated.updatedAt,
                  }))
              }

              setUserData(fetchedUserData)
            } else {
              setUserData({
                id: currentUserId,
                role: 'venue',
              })
            }
          } catch (fetchError) {
            console.error(
              'Error fetching user/venue data:',
              fetchError,
            )
            setError('Error al cargar los datos iniciales.')
          } finally {
            setLoading(false)
          }
        } else {
          setLoading(false)
        }
      },
    )

    return () => unsubscribe()
  }, [])

  // Return the state variables
  return { userId, userData, loading, error }
}

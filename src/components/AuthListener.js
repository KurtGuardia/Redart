import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { auth } from '../lib/firebase-client'

export default function AuthListener() {
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      // Only handle unauthenticated redirects for non-auth pages
      const isAuthPage = ['/login', '/register'].includes(
        router.pathname,
      )
      if (!user && !isAuthPage && router.pathname !== '/') {
        // Prevent redirect loop by checking if we're not already heading to login
        if (!router.asPath.startsWith('/login')) {
          router.push(
            `/login?redirect=${encodeURIComponent(
              router.asPath,
            )}`,
          )
        }
      }
    })
    return () => unsubscribe()
  }, [router.pathname]) // Only depend on pathname changes

  return null
}

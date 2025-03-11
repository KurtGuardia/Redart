import { auth } from './firebase-client'

export const requireAuth = async () => {
  // Simple check for auth state
  if (typeof window !== 'undefined' && !auth?.currentUser) {
    return {
      redirect: {
        destination: '/login',
        permanent: false
      }
    }
  }

  return {
    props: {}
  }
}

export const checkAuth = () => {
  return !!auth?.currentUser
}

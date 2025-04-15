//This layout exists because the server-side check in generateMetadata provides a more robust and efficient way to handle authentication and metadata for the entire /dashboard segment

import { requireAuth } from '../../lib/auth-middleware'

export async function generateMetadata () {
  const authCheck = await requireAuth()
  if ( authCheck.redirect ) {
    return authCheck
  }

  return {
    title: 'Dashboard - Radart',
    description:
      'Gestiona tu espacio cultural, eventos y perfil en Radart.',
    robots: {
      index: false, // Prevent search engines from indexing this page
      follow: false, // Prevent search engines from following links from this page
    },
  }
}

export default function DashboardLayout ( { children } ) {
  return <>{children}</>
}

import { requireAuth } from '../../lib/auth-middleware'

export async function generateMetadata() {
  const authCheck = await requireAuth()
  if (authCheck.redirect) {
    return authCheck
  }

  return {
    title: 'Dashboard - Radarte',
  }
}

export default function DashboardLayout({ children }) {
  return <>{children}</>
}

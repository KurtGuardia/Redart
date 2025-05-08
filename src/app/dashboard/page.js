'use client'

import { useEffect } from 'react'
import { auth } from '../../lib/firebase-client'
import { signOutAndRedirect } from '../../lib/utils'
import { useRouter } from 'next/navigation'
import DashboardSkeleton from '../../components/DashboardSkeleton'
import VenueDashboard from '../../components/dashboard/VenueDashboard'
import UserDashboard from '../../components/dashboard/UserDashboard'
import { useUserData } from '../../hooks/useUserData'
import Spots from '../../components/ui/Spots'

export default function Dashboard() {
  const router = useRouter()
  const { userId, userData, loading, error } = useUserData()
  console.log('userData: ' + userData)

  useEffect(() => {
    if (!loading && !userId && !error) {
      router.push('/login')
    }
  }, [loading, userId, error, router])

  if (loading) {
    return <DashboardSkeleton />
  }

  if (error) throw error

  if (!userData) {
    console.error(
      'Página de Dashboard: Carga completa, sin errores, pero sin datos de usuario. Mostrando esqueleto/error.',
    )
    return <DashboardSkeleton />
  }

  const renderDashboard = () => {
    console.log(userData.role)
    switch (userData.role) {
      case 'venue':
        return <VenueDashboard venueId={userId} />
      case 'user':
        return (
          <UserDashboard
            userData={userData}
            loading={false}
          />
        )
      default:
        console.warn(
          'Unknown user role in renderDashboard:',
          userData.role,
        )
        return (
          <div className='text-orange-500 p-4 text-center'>
            Rol de usuario no reconocido (
            {userData.role || 'undefined'}).
            <button
              onClick={() =>
                signOutAndRedirect(auth, router)
              }
              className='mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
            >
              Cerrar Sesión
            </button>
          </div>
        )
    }
  }

  return (
    <div className='relative mx-auto px-4 sm:px-8 my-16 sm:my-24 2xl:max-w-[90%] 2xl:min-w-[80%]'>
      <Spots count={3} />

      <div className='min-h-[60vh]'>
        {renderDashboard()}
      </div>

      <div className='w-fit mx-auto p-4 mt-8'>
        <button
          onClick={() => signOutAndRedirect(auth, router)}
          className='w-full py-2 px-4 bg-red-500 text-white font-semibold md:text-lg 2xl:text-2xl rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2'
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}

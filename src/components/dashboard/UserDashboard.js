'use client'

import React from 'react'
import DashboardSkeleton from '../DashboardSkeleton'
import RatedList from './RatedList'
import { formatTimestamp } from '../../lib/utils'

export default function UserDashboard({
  userData,
  loading,
}) {
  if (loading) {
    return <DashboardSkeleton />
  }

  if (!userData) {
    return (
      <div>
        No se pudieron cargar los datos del usuario.
      </div>
    )
  }

  const ratings = Array.isArray(userData.ratings)
    ? userData.ratings
    : []

  const ratedVenues = ratings.filter(
    (fav) => fav.type === 'venue',
  )
  const ratedEvents = ratings.filter(
    (fav) => fav.type === 'event',
  )

  return (
    <div className='p-6 md:p-10'>
      <div className='mb-8'>
        <h1 className='text-3xl md:text-4xl font-bold mb-1'>
          Hola, {userData.name}!
        </h1>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-8 xl:gap-12'>
        <RatedList
          title='Locales Puntuados'
          items={ratedVenues}
          type='venue'
        />

        <RatedList
          title='Eventos Puntuados'
          items={ratedEvents}
          type='event'
        />
      </div>
      <p className='text-[var(--blue-500)] text-xs mt-6'>
        Miembro desde:{' '}
        {formatTimestamp(userData.createdAt, {
          timeStyle: undefined,
        })}
      </p>
    </div>
  )
}

'use client'

import React, { useState } from 'react'
import DashboardSkeleton from '../DashboardSkeleton'
import RatedList from './RatedList'
import { formatTimestamp } from '../../lib/utils'

export default function UserDashboard({
  userData,
  loading,
}) {
  // Add state to manage the user's ratings locally
  const [userRatings, setUserRatings] = useState(
    Array.isArray(userData?.ratings)
      ? userData.ratings
      : [],
  )

  // Update state when userData changes (e.g., on initial load)
  React.useEffect(() => {
    if (userData && Array.isArray(userData.ratings)) {
      setUserRatings(userData.ratings)
    }
  }, [userData])

  // Handler for when an item is deleted from one of the RatedList components
  const handleItemDeleted = (targetId, type) => {
    // Update local state to remove the deleted rating
    setUserRatings((prevRatings) =>
      prevRatings.filter(
        (item) => item.targetId !== targetId,
      ),
    )
  }

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

  // Filter ratings by type using the local state
  const ratedVenues = userRatings.filter(
    (fav) => fav.type === 'venue',
  )
  const ratedEvents = userRatings.filter(
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
          onItemDeleted={handleItemDeleted}
        />

        <RatedList
          title='Eventos Puntuados'
          items={ratedEvents}
          type='event'
          onItemDeleted={handleItemDeleted}
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

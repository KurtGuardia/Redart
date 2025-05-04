'use client'

import { useFeaturedEvents } from '../../hooks/useFeaturedEvents'
import EventCard from './EventCard'
import Spots from '../ui/Spots'
import Link from 'next/link'
import EventCardSkeleton from './EventCardSkeleton'

export default function FeaturedEventsList() {
  const { events, loading } = useFeaturedEvents()

  return (
    <>
      <section className='featured-events py-16 mt-18'>
        <div className='relative mx-auto px-4'>
          <Spots count={5} />
          <h2 className='text-3xl xl:text-5xl font-bold text-center mb-10 xl:mb-16   bg-gradient-to-r from-[var(--blue-600)] to-[var(--blue-900)] bg-clip-text text-transparent px-6 py-3 rounded-lg'>
            Eventos destacados
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-14 xl:mb-24 w-full min-w-[80vw] justify-items-center'>
            {loading &&
              Array.from({ length: 3 }).map((_, index) => (
                <EventCardSkeleton
                  key={`initial-skeleton-${index}`}
                />
              ))}

            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>

          <div className='text-center'>
            <Link
              href='/events'
              className='bg-[var(--secondary-color)] text-[var(--secondary-color-foreground)] px-6 py-2 rounded-full  hover:bg-teal-700 hover:text-[var(--white)] transition duration-300 text-sm xl:text-xl font-semibold shadow-md mx-auto'
            >
              Ver todos los eventos
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}

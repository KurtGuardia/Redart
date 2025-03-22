'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import useHasScrolled from '../hooks/useHasScrolled'
import { auth } from '../lib/firebase-client'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@radix-ui/react-avatar'
import { useVenueData } from '../hooks/useVenueData'

function useIsIndexPage() {
  const pathname = usePathname()
  return pathname === '/'
}

export default function Navbar() {
  const isIndexPage = useIsIndexPage()
  const hasScrolled = useHasScrolled()
  const router = useRouter()
  const [user, setUser] = useState(null)
  const {
    venue,
    loading: venueLoading,
    error: venueError,
  } = useVenueData(user?.uid)

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(
      (currentUser) => {
        setUser(currentUser)
      },
    )
    return () => unsubscribe()
  }, [])

  const handleAvatarClick = () => {
    router.push('/dashboard')
  }

  return (
    <nav
      className={`fixed top-0 left-0 right-0 shadow-md z-[1001] h-16 transition-all duration-300 ${
        hasScrolled
          ? 'bg-white shadow-md'
          : 'bg-transparent'
      } ${
        isIndexPage
          ? hasScrolled
            ? 'bg-white/80 backdrop-blur-sm'
            : ''
          : '!bg-[var(--background)] text-foreground'
      }`}
    >
      <div className='container mx-auto px-4 py-3 flex justify-between items-center h-full'>
        <Link
          className='text-2xl font-bold text-primary'
          href='/'
        >
          Radarte
        </Link>
        <div className='space-x-6 flex items-center'>
          <Link
            className={`text-lg ${
              isIndexPage && !hasScrolled
                ? 'text-white'
                : 'text-foreground'
            } ${
              isIndexPage && !hasScrolled
                ? 'hover:text-white'
                : 'hover:text-primary'
            } hover:underline underline-offset-8 font-bold`}
            href='/'
          >
            Inicio
          </Link>
          <Link
            className={`text-lg ${
              isIndexPage && !hasScrolled
                ? 'text-white'
                : 'text-foreground'
            } ${
              isIndexPage && !hasScrolled
                ? 'hover:text-white'
                : 'hover:text-primary'
            } hover:underline underline-offset-8 font-bold`}
            href='/events'
          >
            Eventos
          </Link>
          <Link
            className={`text-lg ${
              isIndexPage && !hasScrolled
                ? 'text-white'
                : 'text-foreground'
            } ${
              isIndexPage && !hasScrolled
                ? 'hover:text-white'
                : 'hover:text-primary'
            } hover:underline underline-offset-8 font-bold`}
            href='/map'
          >
            Locaciones
          </Link>
          <Link
            className={`text-lg ${
              isIndexPage && !hasScrolled
                ? 'text-white'
                : 'text-foreground'
            } ${
              isIndexPage && !hasScrolled
                ? 'hover:text-white'
                : 'hover:text-primary'
            } hover:underline underline-offset-8 font-bold`}
            href='/faq'
          >
            ¿Qué es Radarte?
          </Link>
          {user && (
            <div
              onClick={handleAvatarClick}
              className='cursor-pointer ml-2 h-8 w-8'
            >
              <Avatar className=''>
                <AvatarImage
                  src={
                    venue?.logo ||
                    'https://img.icons8.com/ios/50/000000/user--v1.png'
                  }
                  alt={venue?.name || user.email}
                  className='h-full w-full object-cover rounded-full'
                />
                <AvatarFallback className='h-full w-full flex items-center justify-center rounded-full bg-muted text-white'>
                  {venue?.name?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </div>
          )}
          {!user && (
            <Link
              className={`text-lg ${
                isIndexPage && !hasScrolled
                  ? 'text-white'
                  : 'text-foreground'
              } ${
                isIndexPage && !hasScrolled
                  ? 'hover:text-white'
                  : 'hover:text-primary'
              } hover:underline underline-offset-8 font-bold`}
              href='/login'
            >
              Iniciar sesión
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}

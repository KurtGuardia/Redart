'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import useHasScrolled from '../../hooks/useHasScrolled'
import { auth } from '../../lib/firebase-client'
import { signOutAndRedirect } from '../../lib/utils'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@radix-ui/react-avatar'
import { useVenueData } from '../../hooks/useVenueData'
import { useIsIndexPage } from '../../hooks/useIsIndexPage'

export default function Navbar () {
  const isIndexPage = useIsIndexPage()
  const hasScrolled = useHasScrolled()
  const router = useRouter()
  const [user, setUser] = useState( null )
  const { venue } = useVenueData( user?.uid )
  const [avatarMenuOpen, setAvatarMenuOpen] = useState( false )
  const avatarMenuTimeout = useRef( null )

  useEffect( () => {
    const unsubscribe = auth.onAuthStateChanged(
      ( currentUser ) => {
        setUser( currentUser )
      },
    )
    return () => unsubscribe()
  }, [] )

  const handleAvatarMenuOpen = () => {
    if ( avatarMenuTimeout.current ) {
      clearTimeout( avatarMenuTimeout.current )
      avatarMenuTimeout.current = null
    }
    setAvatarMenuOpen( true )
  }

  const handleAvatarMenuClose = () => {
    avatarMenuTimeout.current = setTimeout( () => {
      setAvatarMenuOpen( false )
    }, 1000 )
  }

  const handleAvatarClick = () => {
    router.push( '/dashboard' )
  }

  const handleSignOut = ( e ) => {
    e.stopPropagation();
    setAvatarMenuOpen( false );
    signOutAndRedirect( auth, router );
  }

  return (
    <nav
      className={`fixed top-0 left-0 right-0 shadow-md z-[1001] transition-all duration-300 ${hasScrolled
        ? 'bg-white shadow-md'
        : 'bg-transparent'
        } ${isIndexPage
          ? hasScrolled
            ? 'bg-white/80 backdrop-blur-sm'
            : ''
          : '!bg-[var(--background)] text-foreground'
        }`}
    >
      <div className='container mx-auto px-10 2xl:px-4 py-1 2xl:py-3 flex justify-between items-center h-full'>
        <Link
          className='text-2xl font-bold text-primary'
          href='/'
        >
          Radart
        </Link>

        <div className='space-x-10 flex items-center'>
          <Link
            className={`text-sm lg:text-lg 2xl:text-2xl ${isIndexPage && !hasScrolled
              ? 'text-white'
              : 'text-foreground'
              } ${isIndexPage && !hasScrolled
                ? 'hover:text-white'
                : 'hover:text-primary'
              } hover:underline underline-offset-8 font-bold`}
            href='/'
          >
            Inicio
          </Link>
          <Link
            className={`text-sm lg:text-lg 2xl:text-2xl  ${isIndexPage && !hasScrolled
              ? 'text-white'
              : 'text-foreground'
              } ${isIndexPage && !hasScrolled
                ? 'hover:text-white'
                : 'hover:text-primary'
              } hover:underline underline-offset-8 font-bold`}
            href='/events'
          >
            Eventos
          </Link>
          <Link
            className={`text-sm lg:text-lg 2xl:text-2xl  ${isIndexPage && !hasScrolled
              ? 'text-white'
              : 'text-foreground'
              } ${isIndexPage && !hasScrolled
                ? 'hover:text-white'
                : 'hover:text-primary'
              } hover:underline underline-offset-8 font-bold`}
            href='/map'
          >
            Locaciones
          </Link>
          <Link
            className={`text-sm lg:text-lg 2xl:text-2xl  ${isIndexPage && !hasScrolled
              ? 'text-white'
              : 'text-foreground'
              } ${isIndexPage && !hasScrolled
                ? 'hover:text-white'
                : 'hover:text-primary'
              } hover:underline underline-offset-8 font-bold`}
            href='/faq'
          >
            ¿Qué es Radart?
          </Link>
          {user && (
            <div
              className='group ml-2 flex flex-col items-center w-10 min-w-[2.5rem] select-none'
              tabIndex={0}
              onFocus={handleAvatarMenuOpen}
              onMouseEnter={handleAvatarMenuOpen}
              onMouseLeave={handleAvatarMenuClose}
            >
              <div
                onClick={handleAvatarClick}
                className='cursor-pointer h-12 w-12 outline-none'
                tabIndex={-1}
                aria-label='Ir al dashboard'
              >
                <Avatar>
                  <AvatarImage
                    src={
                      venue?.logo ||
                      'https://img.icons8.com/ios/50/000000/user--v1.png'
                    }
                    alt={venue?.name || user.email}
                    className='h-full w-full object-cover rounded-full ring-1 ring-gray-400 shadow-lg'
                  />
                  <AvatarFallback className='h-full w-full flex items-center justify-center rounded-full bg-muted text-white'>
                    {venue?.name?.[0]?.toUpperCase() ||
                      'User Radart'}
                  </AvatarFallback>
                </Avatar>
              </div>
              {avatarMenuOpen && (
                <button
                  onClick={handleSignOut}
                  onMouseEnter={handleAvatarMenuOpen}
                  onMouseLeave={handleAvatarMenuClose}
                  className='absolute z-20 top-full mt-2 px-4 py-2 rounded-lg bg-red-500 text-white font-semibold shadow-lg border border-red-600 transition-all duration-200 hover:bg-red-600 focus:bg-red-700 focus:outline-none text-sm md:text-base 2xl:text-lg whitespace-nowrap pointer-events-auto'
                  style={{ minWidth: '120px' }}
                  tabIndex={0}
                >
                  Cerrar Sesión
                </button>
              )}
            </div>
          )}
          {!user && (
            <Link
              className={`xl:text-2xl text-lg ${isIndexPage && !hasScrolled
                ? 'text-white'
                : 'text-foreground'
                } ${isIndexPage && !hasScrolled
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

'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import useHasScrolled from '../../hooks/useHasScrolled'
import { auth } from '../../lib/firebase-client'
import { signOutAndRedirect } from '../../lib/utils'
import {
  Avatar as RadixAvatar, // Renamed to avoid conflict if needed, though not strictly necessary here
  AvatarFallback,
  AvatarImage,
} from '@radix-ui/react-avatar'
import { useVenueData } from '../../hooks/useVenueData'
import { useIsIndexPage } from '../../hooks/useIsIndexPage'

export default function Navbar() {
  const isIndexPage = useIsIndexPage()
  const hasScrolled = useHasScrolled()
  const router = useRouter()
  const [user, setUser] = useState(null)
  const { venue } = useVenueData(user?.uid)
  const [avatarMenuOpen, setAvatarMenuOpen] =
    useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] =
    useState(true)
  const avatarMenuTimeout = useRef(null)

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(
      (currentUser) => {
        setUser(currentUser)
      },
    )
    return () => unsubscribe()
  }, [])

  const handleAvatarMenuOpen = () => {
    if (avatarMenuTimeout.current) {
      clearTimeout(avatarMenuTimeout.current)
      avatarMenuTimeout.current = null
    }
    setAvatarMenuOpen(true)
  }

  const handleAvatarMenuClose = () => {
    avatarMenuTimeout.current = setTimeout(() => {
      setAvatarMenuOpen(false)
    }, 1000)
  }

  const handleAvatarClick = () => {
    setIsMobileMenuOpen(false)
    router.push('/dashboard')
  }

  const handleSignOut = (e) => {
    e.stopPropagation()
    setIsMobileMenuOpen(false)
    setAvatarMenuOpen(false)
    signOutAndRedirect(auth, router)
  }

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const handleMobileLinkClick = () => {
    setIsMobileMenuOpen(false)
  }

  const navLinkClasses = (
    baseClass = 'text-sm lg:text-lg font-bold',
  ) => {
    const hoverClass =
      isIndexPage && !hasScrolled
        ? 'hover:text-white hover:underline underline-offset-8'
        : 'hover:text-primary hover:underline underline-offset-8'
    const colorClass =
      isIndexPage && !hasScrolled
        ? 'text-white'
        : 'text-foreground'
    return `${baseClass} ${colorClass} ${hoverClass}`
  }

  const mobileNavLinkClasses = (
    baseClass = 'block py-2 px-4 text-sm font-medium',
  ) => {
    return `${baseClass} text-gray-700 hover:bg-gray-100`
  }

  const getNavClasses = () => {
    const baseClasses =
      'fixed top-0 left-0 right-0 z-[1020] transition-all duration-300 shadow-md'
    let conditionalClasses = ''

    if (isIndexPage) {
      if (hasScrolled) {
        conditionalClasses = 'bg-white/80 backdrop-blur-sm'
      } else {
        conditionalClasses = 'bg-transparent'
      }
    } else {
      conditionalClasses = 'bg-[var(--background)]'
    }
    return `${baseClasses} ${conditionalClasses}`
  }

  return (
    <>
      <nav className={getNavClasses()}>
        <div className='container mx-auto px-4 sm:px-6 lg:px-10 2xl:px-4 py-1 2xl:py-3 flex justify-between items-center h-full'>
          <Link
            className='text-2xl font-bold text-primary'
            href='/'
            onClick={handleMobileLinkClick}
          >
            Radart
          </Link>

          <div className='hidden lg:flex space-x-10 items-center'>
            <Link className={navLinkClasses()} href='/'>
              Inicio
            </Link>
            <Link
              className={navLinkClasses()}
              href='/events'
            >
              Eventos
            </Link>
            <Link className={navLinkClasses()} href='/map'>
              Locaciones
            </Link>
            <Link className={navLinkClasses()} href='/faq'>
              ¿Qué es Radart?
            </Link>

            {user ? (
              <div
                className='relative group ml-2 flex flex-col items-center w-10 min-w-[2.5rem] select-none'
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
                  <RadixAvatar>
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
                        'U'}
                    </AvatarFallback>
                  </RadixAvatar>
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
            ) : (
              <Link
                className={navLinkClasses()}
                href='/login'
              >
                Iniciar sesión
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className='lg:hidden flex items-center'>
            <button
              onClick={handleMobileMenuToggle}
              className={`inline-flex items-center justify-center p-2 rounded-md ${
                isIndexPage && !hasScrolled
                  ? 'text-white'
                  : 'text-gray-700'
              } hover:text-gray-900 hover:bg-gray-100 focus:outline-none`}
              aria-controls='mobile-menu'
              aria-expanded={isMobileMenuOpen}
            >
              <span className='sr-only'>
                Abrir menú principal
              </span>
              {/* Icon when menu is closed */}
              <svg
                className={`${
                  isMobileMenuOpen ? 'hidden' : 'block'
                } h-6 w-6`}
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
                aria-hidden='true'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M4 6h16M4 12h16m-7 6h7'
                />
              </svg>
              {/* Icon when menu is open */}
              <svg
                className={`${
                  isMobileMenuOpen ? 'block' : 'hidden'
                } h-6 w-6`}
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
                aria-hidden='true'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M6 18L18 6M6 6l12 12'
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <div
          className={`${
            isMobileMenuOpen ? 'block' : 'hidden'
          } lg:hidden absolute top-full left-0 right-0 bg-white shadow-lg`}
          id='mobile-menu'
        >
          {/* Links */}
          <div className='px-2 pt-2 pb-3 space-y-1 sm:px-3'>
            <Link
              href='/'
              className={mobileNavLinkClasses()}
              onClick={handleMobileLinkClick}
            >
              Inicio
            </Link>
            <Link
              href='/events'
              className={mobileNavLinkClasses()}
              onClick={handleMobileLinkClick}
            >
              Eventos
            </Link>
            <Link
              href='/map'
              className={mobileNavLinkClasses()}
              onClick={handleMobileLinkClick}
            >
              Locaciones
            </Link>
            <Link
              href='/faq'
              className={mobileNavLinkClasses()}
              onClick={handleMobileLinkClick}
            >
              ¿Qué es Radart?
            </Link>
          </div>
          {/* User/Login Section */}
          <div className='pt-4 pb-3 border-t border-gray-200'>
            {user ? (
              <div className='px-4 flex items-center justify-between'>
                <div className='flex items-center'>
                  <div
                    className='flex-shrink-0 h-10 w-10 cursor-pointer'
                    onClick={handleAvatarClick}
                  >
                    <RadixAvatar>
                      <AvatarImage
                        src={
                          venue?.logo ||
                          'https://img.icons8.com/ios/50/000000/user--v1.png'
                        }
                        alt={venue?.name || user.email}
                        className='h-full w-full object-cover rounded-full ring-1 ring-gray-300'
                      />
                      <AvatarFallback className='h-full w-full flex items-center justify-center rounded-full bg-muted text-white'>
                        {venue?.name?.[0]?.toUpperCase() ||
                          'U'}
                      </AvatarFallback>
                    </RadixAvatar>
                  </div>
                  <div className='ml-3'>
                    <div className='text-base font-medium text-gray-800'>
                      {venue?.name || user.email}
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className='ml-auto flex-shrink-0 bg-red-500 p-1 rounded-md text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 text-xs'
                >
                  Cerrar Sesión
                </button>
              </div>
            ) : (
              <div className='px-2 space-y-1'>
                <Link
                  href='/login'
                  className={mobileNavLinkClasses(
                    'block px-3 py-2 rounded-md text-base font-medium',
                  )}
                  onClick={handleMobileLinkClick}
                >
                  Iniciar sesión
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 bg-black/70 backdrop-blur-sm z-[1010] lg:hidden transition-opacity duration-300 ease-in-out ${
          isMobileMenuOpen
            ? 'pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleMobileMenuToggle}
        aria-hidden={!isMobileMenuOpen}
      />
    </>
  )
}

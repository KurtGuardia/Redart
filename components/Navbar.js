import Link from 'next/link'
import { useState, useEffect } from 'react'
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from '@/components/ui/avatar'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) {
        setScrolled(true)
      } else {
        setScrolled(false)
      }
    }

    window.addEventListener('scroll', handleScroll)

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 shadow-md z-50 h-16 ${
        scrolled
          ? 'bg-white/80 backdrop-blur-sm shadow-md'
          : ''
      }`}
    >
      <div className='container mx-auto px-4 py-3 flex justify-between items-center h-full'>
        <Link
          className='text-2xl font-bold text-primary'
          href='/'
        >
          Radarte
        </Link>
        <div className='space-x-4 flex items-center'>
          <Link
            className='text-lg text-foreground hover:text-primary hover:underline underline-offset-2'
            href='/events'
          >
            Eventos
          </Link>
          <Link
            className='text-lg text-foreground hover:text-primary hover:underline underline-offset-2'
            href='/faq'
          >
            FAQ
          </Link>
          <Link
            className='text-lg text-foreground hover:text-primary hover:underline underline-offset-2'
            href='/map'
          >
            Mapa
          </Link>
          <Link
            className='text-lg text-foreground hover:text-primary hover:underline underline-offset-2'
            href='/login'
          >
            Iniciar sesión
          </Link>
          <Avatar className='ml-2 h-8 w-8'>
            <AvatarImage
              src='https://github.com/shadcn.png'
              alt='@shadcn'
              className='h-full w-full object-cover rounded-full'
            />
            <AvatarFallback className='h-full w-full flex items-center justify-center rounded-full bg-muted text-white'>
              CN
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </nav>
  )
}

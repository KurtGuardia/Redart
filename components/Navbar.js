import Link from 'next/link'
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

export default function Navbar() {
  return (
    <nav className='fixed top-0 left-0 right-0 bg-[var(--background)] shadow-md z-50 h-16'>
      <div className='container mx-auto px-4 py-3 flex justify-between items-center h-full'>
        <Link
          className='text-2xl font-bold text-primary'
          href='/'
        >
          Radarte
        </Link>
        <div className='space-x-4 flex items-center'>
          <Link
            className='text-foreground hover:text-primary'
            href='/events'
          >
            Eventos
          </Link>
          <Link
            className='text-foreground hover:text-primary'
            href='/faq'
          >
            FAQ
          </Link>
          <Link
            className='text-foreground hover:text-primary'
            href='/map'
          >
            Mapa
          </Link>
          <Link
            className='text-foreground hover:text-primary'
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

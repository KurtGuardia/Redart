import Link from 'next/link'
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

export default function Navbar() {
  return (
    <nav className='fixed top-0 left-0 right-0 bg-white shadow-md z-50'>
      <div className='container mx-auto px-4 py-3 flex justify-between items-center'>
        <Link
          className='text-2xl font-bold text-teal-600'
          href='/'
        >
          Radarte
        </Link>
        <div className='space-x-4 flex items-center'>
          <Link
            className='text-gray-600 hover:text-teal-600'
            href='/campaigns'
          >
            Campañas
          </Link>
          <Link
            className='text-gray-600 hover:text-teal-600'
            href='/faq'
          >
            FAQ
          </Link>
          <Link
            className='text-gray-600 hover:text-teal-600'
            href='/map'
          >
            Mapa
          </Link>
          <Link
            className='text-gray-600 hover:text-teal-600'
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
            <AvatarFallback className='h-full w-full flex items-center justify-center rounded-full bg-gray-500 text-white'>
              CN
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </nav>
  )
}

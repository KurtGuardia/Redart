import Link from 'next/link'
import useIsIndexPage from '@/hooks/use-is-index-page'
import useHasScrolled from '../hooks/useHasScrolled'
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from '@/components/ui/avatar'

export default function Navbar () {
  const isIndexPage = useIsIndexPage()
  const hasScrolled = useHasScrolled()

  return (
    <nav
      className={`fixed top-0 left-0 right-0 shadow-md z-50 h-16 transition-all duration-300 ${hasScrolled ? 'bg-white shadow-md' : 'bg-transparent'} ${isIndexPage
        ? hasScrolled
          ? 'bg-white/80 backdrop-blur-sm shadow-md'
          : ''
        : 'bg-[var(--background)] text-foreground'
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
            className={`text-lg ${isIndexPage && !hasScrolled
              ? 'text-white'
              : 'text-foreground'
              } ${isIndexPage && !hasScrolled
                ? 'hover:text-white'
                : 'hover:text-primary'
              } hover:underline underline-offset-8 font-bold`}
            href='/'
          >
            Inicio
          </Link> <Link
            className={`text-lg ${isIndexPage && !hasScrolled
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
            className={`text-lg ${isIndexPage && !hasScrolled
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
            className={`text-lg ${isIndexPage && !hasScrolled
              ? 'text-white'
              : 'text-foreground'
              } ${isIndexPage && !hasScrolled
                ? 'hover:text-white'
                : 'hover:text-primary'
              } hover:underline underline-offset-8 font-bold`}
            href='/faq'
          >
            ¿Qué es Radarte?
          </Link>
          <Link
            className={`text-lg ${isIndexPage && !hasScrolled
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

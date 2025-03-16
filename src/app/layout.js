'use client'

import '../styles/globals.css'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { usePathname } from 'next/navigation'
// import { useIsIndexPage } from '../hooks/useIsIndexPage'

function useIsIndexPage() {
  const pathname = usePathname()
  return pathname === '/'
}

export default function Layout({ children }) {
  const isIndexPage = useIsIndexPage()

  return (
    <html lang='en'>
      <body className='flex flex-col min-h-screen'>
        <Navbar />
        <main
          className={`relative flex flex-col justify-between items-center flex-grow ${
            isIndexPage ? '' : 'my-20'
          }`}
        >
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}

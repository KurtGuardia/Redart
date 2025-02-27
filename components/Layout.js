import Navbar from './Navbar'
import Footer from './Footer'
import useIsIndexPage from '@/hooks/use-is-index-page'

export default function Layout ( { children } ) {
  const isIndexPage = useIsIndexPage()
  return (
    <div className='flex flex-col min-h-screen'>
      <Navbar />
      <main
        className={`relative flex-grow ${isIndexPage ? '' : 'my-20'
          }`}
      >
        {children}
      </main>
      <Footer />
    </div>
  )
}

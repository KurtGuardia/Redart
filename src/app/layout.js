import '../styles/globals.css'
import Navbar from '../components/ui/Navbar'
import Footer from '../components/ui/Footer'

// Metadata for the app
export const metadata = {
  title: 'Radart - Plataforma Cultural',
  description:
    'Encuentra espacios culturales y eventos en tu ciudad',
}

// Make the layout async
export default async function RootLayout ( { children } ) {
  return (
    <html lang='es' suppressHydrationWarning={true}>
      <body>
        <Navbar />
        <main className='relative flex flex-col justify-between items-center flex-grow'>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}

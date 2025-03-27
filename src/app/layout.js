import '../styles/globals.css'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

// Metadata for the app
export const metadata = {
  title: 'Radarte - Plataforma Cultural',
  description:
    'Encuentra espacios culturales y eventos en tu ciudad',
}

export default function RootLayout({ children }) {
  return (
    <html lang='en'>
      <body className='flex flex-col min-h-screen'>
        <Navbar />
        <main className='relative flex flex-col justify-between items-center flex-grow'>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}

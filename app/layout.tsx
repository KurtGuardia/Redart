import { Inter } from "next/font/google"
import "./globals.css"
import { Navbar } from "./components/navbar"
import Footer from "./components/Footer"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Redarte - Plataforma de Artes en Cochabamba",
  description: "Descubre eventos de música, teatro y más en Cochabamba",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={inter.className}>
      <body className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-grow">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}

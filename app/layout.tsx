import "./globals.css"
import { Inter } from "next/font/google"
import { Navbar } from "./components/navbar"

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
    <html lang="es">
      <body className={inter.className}>
        <Navbar />
        {children}
      </body>
    </html>
  )
}


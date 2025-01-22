import Link from "next/link"
import { Button } from "@/app/components/ui/button"

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-[#09090B] backdrop-blur-sm shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="text-2xl font-bold text-accent">
              Redarte
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" asChild className="text-foreground hover:text-secondary">
              <Link href="#">Iniciar sesión</Link>
            </Button>
            <Button className="friendly-button" asChild>
              <Link href="#">Registrarse</Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}

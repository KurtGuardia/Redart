import Image from "next/image"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs"
import { MapSection } from "./components/map-section"
import { EventsSection } from "./components/events-section"
import { CreateAccountSection } from "./components/create-account-section"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <section className="relative h-[60vh] overflow-hidden">
        <video
          className="absolute top-0 left-0 w-full h-full object-cover opacity-50"
          autoPlay
          loop
          muted
          playsInline
          poster="/placeholder.svg"
        >
          <source src="/placeholder-video.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <Image
          src="https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExMmkxZnYybWdveXM3cjBuZDNjcjc4N2d0aDAwdmxjc2R6eTZtdHI5OSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3oz8xzYgK7lEjm1p0A/giphy.gif"
          alt="Theater GIF"
          width={500}
          height={300}
          className="theater-gif"
        />
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <h1 className="text-4xl md:text-6xl font-bold text-accent text-center">Descubre el Arte en Cochabamba</h1>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Tabs defaultValue="mapa" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8 bg-secondary">
            <TabsTrigger
              value="mapa"
              className="text-lg font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Mapa
            </TabsTrigger>
            <TabsTrigger
              value="eventos"
              className="text-lg font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Eventos
            </TabsTrigger>
            <TabsTrigger
              value="crear-cuenta"
              className="text-lg font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Crear cuenta
            </TabsTrigger>
          </TabsList>
          <TabsContent value="mapa">
            <MapSection />
          </TabsContent>
          <TabsContent value="eventos">
            <EventsSection />
          </TabsContent>
          <TabsContent value="crear-cuenta">
            <CreateAccountSection />
          </TabsContent>
        </Tabs>
      </section>
    </main>
  )
}

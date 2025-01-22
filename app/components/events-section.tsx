import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/app/components/ui/card"
import Image from 'next/image'

const events = [
  {
    id: 1,
    title: "Concierto de Jazz",
    description: "Una noche de jazz con los mejores músicos locales",
    image: "/images/jazz-concert.jpg",
    price: "50 Bs",
    time: "20:00",
    place: "link al sitio"
  },
  {
    id: 2,
    title: "Teatro: 'La Casa de Bernarda Alba'",
    description: "Obra clásica de Federico García Lorca",
    image: "/images/teatro-bernarda.jpeg",
    price: "75 Bs",
    time: "19:30",
    place: "link al sitio"
  },
  {
    id: 3,
    title: "Exposición de Arte Contemporáneo",
    description: "Muestra de artistas emergentes de Cochabamba",
    image: "/images/arte-expo.jpg",
    price: "Entrada libre",
    time: "10:00 - 18:00",
    place: "link al sitio"
  },
  // Add more events as needed
]

export function EventsSection() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((event) => (
        <Card key={event.id} className="overflow-hidden transition-transform hover:scale-105 bg-card">
          <Image
            src={event.image || "/placeholder.svg"}
            alt={event.title}
            className="w-full h-48 object-cover opacity-80"
            width={400}
            height={200}
          />
          <CardHeader>
            <CardTitle className="text-foreground">{event.title}</CardTitle>
            <CardDescription className="text-muted-foreground">{event.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold text-accent">{event.price}</p>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-muted-foreground">{event.time}</p>&nbsp;-&nbsp;
            <a href="#" className="text-sm text-muted-foreground">{event.place}</a>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}

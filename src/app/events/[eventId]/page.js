import { notFound } from 'next/navigation'
import EventData from '../../../components/event/EventData'

export default function EventDetailPage({ params }) {
  const eventId = params.eventId

  if (!eventId) {
    notFound()
  }

  return (
    <div className='container mx-auto px-4 py-8'>
      <EventData eventId={eventId} />
    </div>
  )
}

// Metadata generation
export async function generateMetadata({ params }) {
  // Since we cannot fetch data server-side here according to constraints,
  // provide a generic title and description.
  // The client component will attempt to update these after loading.
  const eventId = params.eventId
  return {
    title: 'Detalles del Evento | Radarte',
    description:
      'Descubre los detalles de este evento en Radarte.',
    // You could potentially add generic Open Graph tags here too
    // openGraph: { ... }
  }
}

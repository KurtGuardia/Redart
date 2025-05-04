import { notFound } from 'next/navigation'
import EventData from '../../../components/event/EventData'
import Spots from '../../../components/ui/Spots'

export default function EventDetailPage({ params }) {
  const eventId = params.eventId

  if (!eventId) {
    notFound()
  }

  return (
    // Wrapped to leave this as server side and in the component hace client side data fetching (using server side code was not possible this project)
    <>
      <Spots count={8} />
      <EventData eventId={eventId} />
    </>
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
  }
}

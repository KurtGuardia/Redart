// import Spot from '../../components/ui/Spot'
// import { getAllEvents } from '../../lib/eventService'
// import EventListView from './EventListView'

export default async function EventsPage() {
  console.log(
    '[EventsPage] Minimal Server Component CALLED.',
  )

  return (
    <div className='relative container mx-auto my-24'>
      <h1>Events Page - Minimal Test</h1>
      <p>
        If you see this, the basic component rendering
        worked.
      </p>
    </div>
  )
}

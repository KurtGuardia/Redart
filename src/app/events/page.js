import Spot from '../../components/ui/Spot'
import { getAllEvents } from '../../lib/eventService'
import EventListView from './EventListView'

const ITEMS_PER_PAGE = 8

export default async function EventsPage() {
  console.log('[EventsPage] Server Component CALLED.')
  let initialEvents = []
  let initialHasMore = false
  let fetchError = null

  try {
    console.log(
      '[EventsPage] Attempting to call getAllEvents...',
    )
    const result = await getAllEvents(1, ITEMS_PER_PAGE)
    console.log('[EventsPage] getAllEvents call FINISHED.')
    initialEvents = result.events
    initialHasMore = result.hasMore
  } catch (error) {
    console.error(
      '[EventsPage] Error calling or processing getAllEvents:',
      error,
    )
    fetchError = error.message || 'Error al cargar eventos.'
  }

  return (
    <div className='relative container mx-auto my-24'>
      <Spot colorName={'SlateBlue'} />
      <Spot colorName={'Magenta'} />
      <Spot colorName={'red'} />
      <Spot colorName={'red'} />
      <Spot colorName={'Indigo'} />
      <h1 className='text-3xl font-bold text-center mb-12'>
        Próximos Eventos
      </h1>

      {fetchError ? (
        <div className='text-center text-red-500 py-10'>
          Error al cargar eventos: {fetchError}
        </div>
      ) : (
        <EventListView
          initialEvents={initialEvents}
          initialHasMore={initialHasMore}
        />
      )}
    </div>
  )
}

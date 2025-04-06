import Spot from '../../components/ui/Spot'
import { getAllEvents } from '../../lib/eventService'
import EventListView from './EventListView'

const ITEMS_PER_PAGE = 8

export default async function EventsPage() {
  let initialEvents = []
  let initialHasMore = false
  let fetchError = null

  try {
    const result = await getAllEvents({
      page: 1,
      limit: ITEMS_PER_PAGE,
    })
    initialEvents = result.events || []
    initialHasMore = result.hasMore || false
  } catch (error) {
    console.error(
      'Error fetching initial events server-side:',
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

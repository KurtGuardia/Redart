import EventListView from '../../components/event/EventListView'
import Spots from '../../components/ui/Spots'

export default function EventsPage() {
  return (
    <div className='relative mx-auto my-24 max-w-[80%] min-w-[80%]'>
      <Spots count={6} />
      <h1>Próximos Eventos</h1>
      <EventListView />
    </div>
  )
}

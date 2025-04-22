import Spot from '../../components/ui/Spot'
import EventListView from '../../components/event/EventListView'

export default function EventsPage () {
  return (
    <div className='relative mx-auto my-24 max-w-[80%] min-w-[80%]'>
      <Spot colorName={'SlateBlue'} />
      <Spot colorName={'Magenta'} />
      <Spot colorName={'red'} />
      <Spot colorName={'red'} />
      <Spot colorName={'Indigo'} />
      <h1>
        Próximos Eventos
      </h1>
      <EventListView />
    </div>
  )
}

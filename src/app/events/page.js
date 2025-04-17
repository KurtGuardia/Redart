import Spot from '../../components/ui/Spot'
import EventListView from '../../components/event/EventListView'

export default function EventsPage () {
  return (
    <div className='relative container mx-auto my-24'>
      <Spot colorName={'SlateBlue'} />
      <Spot colorName={'Magenta'} />
      <Spot colorName={'red'} />
      <Spot colorName={'red'} />
      <Spot colorName={'Indigo'} />
      <h1 className='text-3xl font-bold text-center xl:mb-12 mb-4'>
        Próximos Eventos
      </h1>
      <EventListView />
    </div>
  )
}

import Spot from '../../components/ui/Spot'
import EventListView from './EventListView'

export default async function EventsPage() {
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
      <EventListView />
    </div>
  )
}

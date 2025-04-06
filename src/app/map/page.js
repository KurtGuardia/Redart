// import Link from 'next/link'
// import Spot from '../../components/ui/Spot'
// import MapView from './MapView'
// import { getAllVenueLocations } from '../../lib/venueService'

export default async function MapPage() {
  console.log('[MapPage] Minimal Server Component CALLED.')

  return (
    <div className='relative container mx-auto my-24'>
      <h1>Map Page - Minimal Test</h1>
      <p>
        If you see this, the basic component rendering
        worked.
      </p>
    </div>
  )
}

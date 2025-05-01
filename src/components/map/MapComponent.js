// Purpose: This component acts as a wrapper specifically to handle the client-side-only nature of react-leaflet.
// Mechanism: It uses next/dynamic with ssr: false. This prevents Next.js from trying to render the Map component (which relies on browser APIs like window) on the server.

import dynamic from 'next/dynamic'

// Dynamically import the map components with no SSR
const MapWithNoSSR = dynamic(() => import('./Map'), {
  ssr: false,
  loading: () => (
    <div className='w-full h-full bg-gray-100 animate-pulse' />
  ),
})

export default function MapComponent(props) {
  return <MapWithNoSSR {...props} />
}

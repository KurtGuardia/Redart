import dynamic from 'next/dynamic'

// Dynamically import the map components with no SSR
const MapWithNoSSR = dynamic(
  () => import( './Map' ),
  {
    ssr: false,
    loading: () => <div className="w-full h-full bg-gray-100 animate-pulse" />
  }
)

export default function MapComponent ( props ) {
  return (
    <MapWithNoSSR {...props} />
  )
}
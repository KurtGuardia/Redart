import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from 'react-leaflet'
import { Icon } from 'leaflet'
import 'leaflet/dist/leaflet.css'

const customIcon = new Icon({
  iconUrl:
    'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl:
    'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

function LocationMarker({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng
      onLocationSelect({ lat, lng })
    },
  })

  return null
}

export default function Map({
  center,
  zoom = 13,
  venues = [],
  onLocationSelect,
}) {
  if (
    !center ||
    !Array.isArray(center) ||
    center.length !== 2
  ) {
    console.error('Invalid center prop provided to Map')
    return null
  }

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={false}
      onClick={(e) => {
        const { lat, lng } = e.latlng
        onLocationSelect({ lat, lng })
      }}
    >
      <TileLayer
        url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
      />
      <LocationMarker onLocationSelect={onLocationSelect} />
      {venues &&
        venues.map((venue, index) => (
          <Marker
            key={index}
            position={[
              venue?.geopoint?.lat || center[0],
              venue?.geopoint?.lng || center[1],
            ]}
            icon={customIcon}
          >
            <Popup>
              <div className='font-semibold'>
                {venue.displayName || 'Unknown User'}
              </div>
            </Popup>
          </Marker>
        ))}
    </MapContainer>
  )
}

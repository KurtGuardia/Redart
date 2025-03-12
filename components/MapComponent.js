import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { Icon } from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Create icon outside component to avoid recreation on every render
const customIcon = new Icon( {
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
} );

export default function MapComponent ( { center, zoom = 13, user } ) {
  // Add prop validation
  if ( !center || !Array.isArray( center ) || center.length !== 2 ) {
    console.error( 'Invalid center prop provided to MapComponent' );
    return null;
  }

  return (
    <div className="w-full h-[400px] relative">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        />
        {user && (
          <Marker position={center} icon={customIcon}>
            <Popup>
              <div className="font-semibold">
                {user.displayName || 'Unknown User'}
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
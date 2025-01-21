'use client'

import { GoogleMap, LoadScript, Marker, OverlayView } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '0.5rem'
};

const center = {
  lat: -17.3895,
  lng: -66.1568
};

const locations = [
  {
    name: "Museo de Arte Contemporáneo",
    position: { lat: -17.3935, lng: -66.1571 },
    description: "Galería principal de arte contemporáneo"
  },
  {
    name: "Centro Cultural Martín Cárdenas",
    position: { lat: -17.3825, lng: -66.1543 },
    description: "Espacio cultural y galería de arte"
  },
  {
    name: "Casa de la Cultura",
    position: { lat: -17.3945, lng: -66.1523 },
    description: "Centro histórico de arte y cultura"
  }
];

const getPixelPositionOffset = (width: number, height: number) => ({
  x: -(width / 2),
  y: -height - 35
});

export default function MapComponent() {
  return (
    <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={14}
      >
        {locations.map((location, index) => (
          <div key={index}>
            <Marker
              position={location.position}
              title={location.name}
            />
            <OverlayView
              position={location.position}
              mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
              getPixelPositionOffset={getPixelPositionOffset}
            >
              <div className="bg-white rounded-lg shadow-md p-3 min-w-[200px]">
                <h2 className="text-gray-600 font-bold text-sm mb-1">{location.name}</h2>
                <p className="text-gray-600 text-xs">{location.description}</p>
              </div>
            </OverlayView>
          </div>
        ))}
      </GoogleMap>
    </LoadScript>
  );
}

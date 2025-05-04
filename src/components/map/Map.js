'use client'

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  useMap,
  Tooltip,
} from 'react-leaflet'
import { Icon } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const DEFAULT_ZOOM = 13

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

function MapController({
  searchResultForMap,
  targetZoom = 16,
}) {
  const map = useMap()

  useEffect(() => {
    if (
      searchResultForMap &&
      typeof searchResultForMap.lat === 'number' &&
      typeof searchResultForMap.lng === 'number'
    ) {
      map.flyTo(
        [searchResultForMap.lat, searchResultForMap.lng],
        targetZoom,
      )
    }
  }, [searchResultForMap, targetZoom, map])

  return null
}

function LocationMarker({ onLocationSelect }) {
  const [position, setPosition] = useState(null)

  useMapEvents({
    click(e) {
      const lat = Number(e.latlng.lat)
      const lng = Number(e.latlng.lng)

      // Validate coordinates and ensure they're proper numbers
      if (isNaN(lat) || isNaN(lng)) return

      setPosition([lat, lng])

      onLocationSelect({
        lat: lat,
        lng: lng,
        // Add these properties to ensure compatibility with different formats
        latitude: lat,
        longitude: lng,
      })
    },
  })

  return position === null ? null : (
    <Marker position={position} icon={customIcon}>
      <Popup>Ubicación seleccionada</Popup>
    </Marker>
  )
}

export default function Map({
  center,
  zoom = DEFAULT_ZOOM,
  venues = [],
  onLocationSelect = () => {},
  searchResultForMap = null,
  mapId = 'map',
  isEditable = false,
}) {
  const router = useRouter()
  const [mapCenter, setMapCenter] = useState(center || null)
  const initialMapZoom = zoom || DEFAULT_ZOOM
  const uniqueMapId = mapId
    ? mapId
    : `map-${Math.random().toString(36).substring(2, 9)}`

  useEffect(() => {
    if (
      center &&
      center.length === 2 &&
      !isNaN(center[0]) &&
      !isNaN(center[1])
    ) {
      setMapCenter(center)
    }
  }, [center])

  const getValidPosition = (venue) => {
    if (
      venue?.location?.latitude != null &&
      venue?.location?.longitude != null
    ) {
      return [
        venue.location.latitude,
        venue.location.longitude,
      ]
    }
    return null
  }

  return (
    <div className='flex flex-col gap-4 h-full'>
      <div
        id={uniqueMapId}
        className={`w-full h-[40vh] md:h-[60vh] mx-auto map-container relative`}
      >
        {!mapCenter && (
          <div className='absolute inset-0 z-20 flex flex-col items-center justify-center'>
            <span className='text-teal-800 font-medium'>
              Detectando ubicación... Cargando mapa...
            </span>{' '}
          </div>
        )}
        {mapCenter && (
          <>
            <MapContainer
              center={mapCenter}
              zoom={initialMapZoom}
              style={{
                height: '100%',
                width: '100%',
                borderRadius: '15px',
              }}
              scrollWheelZoom={true}
            >
              <TileLayer
                url='https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
                attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
              />

              {venues &&
                venues.length > 0 &&
                venues
                  .map((venue) => ({
                    venue,
                    position: getValidPosition(venue),
                  }))
                  .filter((item) => item.position !== null)
                  .map(({ venue, position }) => {
                    const venueName =
                      venue.name || 'Sin nombre'
                    return (
                      <Marker
                        key={venue.id || venueName}
                        position={position}
                        icon={customIcon}
                        eventHandlers={{
                          click: () => {
                            if (venue.id) {
                              router.push(
                                `/venues/${venue.id}`,
                              )
                            }
                          },
                        }}
                      >
                        {venueName && (
                          <Tooltip
                            direction='top'
                            offset={[0, -41]}
                            permanent
                            className='leaflet-tooltip-always font-bold bg-white text-black border border-gray-400 rounded px-2 py-1 shadow'
                          >
                            {venueName}
                          </Tooltip>
                        )}
                      </Marker>
                    )
                  })}

              {isEditable && (
                <LocationMarker
                  onLocationSelect={onLocationSelect}
                />
              )}
              <MapController
                searchResultForMap={searchResultForMap}
              />
            </MapContainer>
          </>
        )}
      </div>
    </div>
  )
}

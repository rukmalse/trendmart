'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix for default Leaflet marker icon path in Next.js
const customIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

interface ServiceLocation {
  id: string
  business_name: string
  lat?: number | null
  lng?: number | null
  phone?: string
  address?: string
  distance_km?: number
}

interface MapProps {
  center: { lat: number; lng: number }
  locations: ServiceLocation[]
}

// Component to smoothly change map view when location updates
function ChangeView({ center }: { center: { lat: number; lng: number } }) {
  const map = useMap()
  useEffect(() => {
    if (center.lat && center.lng) {
      map.setView([center.lat, center.lng], map.getZoom())
    }
  }, [center, map])
  return null
}

export default function LocationMap({ center, locations = [] }: MapProps) {
  // Safety check: Make sure center exists
  if (!center?.lat || !center?.lng) return null

  return (
    <div className="h-[400px] w-full rounded-2xl overflow-hidden border border-gray-200 shadow-sm z-0 relative">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={12}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <ChangeView center={center} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* User Current Location Marker */}
        <Marker position={[center.lat, center.lng]} icon={customIcon}>
          <Popup>
            <div className="text-xs font-bold text-blue-600">📍 Your Selected Location</div>
          </Popup>
        </Marker>

        {/* Service Providers Pins - Filter invalid locations to prevent runtime errors */}
        {locations
          .filter((loc) => loc.lat !== null && loc.lng !== null && loc.lat !== undefined && loc.lng !== undefined)
          .map((loc) => (
            <Marker key={loc.id} position={[loc.lat!, loc.lng!]} icon={customIcon}>
              <Popup>
                <div className="p-1 min-w-[150px]">
                  <h4 className="font-bold text-gray-800 text-sm">{loc.business_name}</h4>
                  {loc.address && <p className="text-xs text-gray-500 mt-0.5">{loc.address}</p>}
                  {loc.distance_km && (
                    <span className="inline-block bg-green-100 text-green-700 font-bold text-[10px] px-2 py-0.5 rounded-full mt-1">
                      {loc.distance_km.toFixed(1)} km away
                    </span>
                  )}
                  {loc.phone && (
                    <a
                      href={`tel:${loc.phone}`}
                      className="mt-2 block w-full bg-blue-600 text-white text-center text-xs py-1 rounded-md font-semibold hover:bg-blue-700 transition"
                    >
                      Call {loc.phone}
                    </a>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </div>
  )
}
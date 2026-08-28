'use client'

import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix for default marker icons in Next.js
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

L.Marker.prototype.options.icon = defaultIcon

function ChangeView({ center }: { center: { lat: number; lng: number } }) {
  const map = useMap()
  
  useEffect(() => {
    if (map && center && typeof center.lat === 'number' && typeof center.lng === 'number') {
      try {
        // Check if map container element is fully rendered and attached to the DOM
        const container = map.getContainer();
        if (container && document.body.contains(container)) {
          map.setView([center.lat, center.lng], map.getZoom() || 13, {
            animate: false // animation එක ඉවත් කිරීම මඟින් _leaflet_pos දෝෂය සම්පූර්ණයෙන්ම වැළකේ
          })
        }
      } catch (e) {
        console.error("Map view update error:", e)
      }
    }
  }, [center, map])

  return null
}

export default function LocationMap({ 
  center, 
  locations 
}: { 
  center: { lat: number; lng: number }
  locations: any[] 
}) {
  const mapRef = useRef<any>(null)

  return (
    // z-0 දීමෙන් මැප් එක නැවත සාමාන්‍ය පරිදි දර්ශනය වේ
    <div className="h-[400px] w-full rounded-2xl overflow-hidden shadow-sm relative z-0">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={13}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
        key={`${center.lat}-${center.lng}`} 
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ChangeView center={center} />

        {/* User Current Location Marker */}
        <Marker position={[center.lat, center.lng]}>
          <Popup>
            <div className="font-bold text-blue-600">Your Current Location</div>
          </Popup>
        </Marker>

        {/* Service Providers Markers */}
        {locations && locations.map((loc) => {
          if (!loc.latitude || !loc.longitude) return null;
          return (
            <Marker key={loc.id} position={[Number(loc.latitude), Number(loc.longitude)]}>
              <Popup>
                <div className="p-1">
                  <h4 className="font-bold text-gray-900 text-sm">{loc.business_name}</h4>
                  {loc.service_category_id && (
                    <span className="inline-block text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full my-1">
                      {loc.service_category_id}
                    </span>
                  )}
                  <p className="text-xs text-gray-600 my-1">{loc.address}</p>
                  <a 
                    href={`tel:${loc.phone}`} 
                    className="inline-block bg-green-600 text-white font-bold text-xs px-3 py-1 rounded-lg mt-1"
                  >
                    Call: {loc.phone}
                  </a>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}
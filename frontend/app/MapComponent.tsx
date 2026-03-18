"use client";
import { useEffect } from 'react';
import { MapContainer, TileLayer, useMap, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default Leaflet icons in Next.js
const icon = L.icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Helper component to handle resizing when sidebar toggles
function MapResizer({ isSidebarOpen }: { isSidebarOpen: boolean }) {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      if (map) {
        map.invalidateSize();
      }
    }, 350); 
    return () => clearTimeout(timer);
  }, [isSidebarOpen, map]);
  return null;
}

export default function MapComponent({ alerts = [], history = [], isSidebarOpen }: any) {
  // CRITICAL FIX: Ensure alerts is ALWAYS an array before calling .map
  const safeAlerts = Array.isArray(alerts) ? alerts : [];
  const safeHistory = Array.isArray(history) ? history : [];

  const activeAlertNames = safeAlerts.map((a: any) => a.location);

  return (
    <div className="h-full w-full relative">
      <MapContainer 
        center={[31.0461, 34.8516]} 
        zoom={8} 
        style={{ height: '100%', width: '100%', background: '#09090b' }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        
        <MapResizer isSidebarOpen={isSidebarOpen} />

        {/* Live Alerts */}
        {safeAlerts.map((alert: any, idx: number) => (
          <Marker 
            key={`live-${idx}`} 
            position={[32.0853, 34.7818]} // Note: You'll need real lat/lng for these cities later
            icon={icon}
          >
            <Popup>{alert.location} - {alert.type}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
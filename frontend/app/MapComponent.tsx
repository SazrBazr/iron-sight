"use client";
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';

// 1. Live Radar Icon (Pulsing Red)
const redRadarIcon = new L.DivIcon({
  className: 'radar-icon',
  html: `<div class="radar-ping"></div><div class="radar-dot"></div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});

// 2. History Icon (Small Faded Dot)
const historyIcon = new L.DivIcon({
  className: 'history-icon',
  html: `<div class="w-2 h-2 bg-zinc-600 rounded-full border border-zinc-400 opacity-50"></div>`,
  iconSize: [10, 10],
  iconAnchor: [5, 5]
});

// 3. Resizer Helper: This solves the "gray gap" issue
function MapResizer({ isSidebarOpen }: { isSidebarOpen: boolean }) {
  const map = useMap();
  useEffect(() => {
    // Small timeout ensures the sidebar animation has finished or started before resizing
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }, [isSidebarOpen, map]);
  return null;
}

export default function MapComponent({ alerts, history, isSidebarOpen }: any) {
  return (
    <div className="h-full w-full relative">
      <MapContainer 
        center={[31.5, 34.8]} 
        zoom={8} 
        className="h-full w-full bg-black z-0"
        zoomControl={false} // Cleaner look for Iron Sight
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
        
        {/* Helper component to fix the resize bug */}
        <MapResizer isSidebarOpen={isSidebarOpen} />

        {/* RENDERING LIVE ALERTS */}
        {alerts?.map((alert: any, i: number) => (
          alert.coords && (
            <Marker key={`live-${i}`} position={[alert.coords.lat, alert.coords.lng]} icon={redRadarIcon}>
              <Popup>
                <div className="text-black p-2 min-w-[120px]">
                  <p className="font-bold text-lg border-b border-gray-100 mb-1">{alert.location}</p>
                  <p className="text-[10px] uppercase font-bold text-red-600 tracking-tighter">{alert.type}</p>
                  <p className="text-[9px] text-gray-400 mt-2 font-mono uppercase">LIVE RADAR ACTIVE</p>
                </div>
              </Popup>
            </Marker>
          )
        ))}

        {/* RENDERING HISTORY (Hidden when Live Tab is active or no history exists) */}
        {history?.map((item: any, i: number) => (
          item.coords && (
            <Marker key={`hist-${i}`} position={[item.coords.lat, item.coords.lng]} icon={historyIcon}>
              <Popup>
                <div className="text-black p-2">
                  <p className="font-bold text-sm">{item.location}</p>
                  <p className="text-[10px] text-gray-500">{item.time}</p>
                </div>
              </Popup>
            </Marker>
          )
        ))}
      </MapContainer>

      {/* CSS for the Pulsing Radar Effect */}
      <style jsx global>{`
        .radar-dot {
          width: 8px;
          height: 8px;
          background: #ef4444;
          border-radius: 50%;
          position: absolute;
          top: 16px;
          left: 16px;
          box-shadow: 0 0 10px #ef4444;
        }
        .radar-ping {
          width: 40px;
          height: 40px;
          border: 2px solid #ef4444;
          border-radius: 50%;
          position: absolute;
          animation: ping 2s infinite;
          opacity: 0;
        }
        @keyframes ping {
          0% { transform: scale(0.2); opacity: 0.8; }
          100% { transform: scale(1.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
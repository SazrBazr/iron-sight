"use client";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const redRadarIcon = new L.DivIcon({
  className: 'radar-icon',
  html: `<div class="radar-ping"></div><div class="radar-dot"></div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});

export default function MapComponent({ alerts }: any) {
  return (
    <MapContainer center={[31.5, 34.8]} zoom={7} className="h-full w-full bg-black">
      <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
      
      {alerts?.map((alert: any, i: number) => (
        alert.coords && (
          <Marker key={i} position={[alert.coords.lat, alert.coords.lng]} icon={redRadarIcon}>
            <Popup>
              <div className="text-black p-2">
                <p className="font-bold text-lg border-b mb-1">{alert.location}</p>
                <p className="text-xs uppercase font-bold text-red-600">{alert.type}</p>
                <p className="text-xs text-gray-500 mt-2">SOURCE: {alert.origin}</p>
              </div>
            </Popup>
          </Marker>
        )
      ))}
    </MapContainer>
  );
}
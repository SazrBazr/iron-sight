"use client";
import dynamic from 'next/dynamic';
import React, { useState, useEffect } from 'react';
import { ShieldAlert, RadioTower } from 'lucide-react';

// Load the Leaflet component ONLY on the client
const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-zinc-900 animate-pulse flex items-center justify-center text-zinc-500">Initializing Radar...</div>
});

const ISRAEL_CITIES: Record<string, { lat: number; lng: number, origin: string }> = {
  "שדרות": { lat: 31.5234, lng: 34.5951, origin: "Gaza" },
  "אשקלון": { lat: 31.6693, lng: 34.5715, origin: "Gaza" },
  "קרית שמונה": { lat: 33.2073, lng: 35.5710, origin: "Lebanon" },
  "משגב עם": { lat: 33.2655, lng: 35.5489, origin: "Lebanon" },
  "תל אביב - יפו": { lat: 32.0853, lng: 34.7818, origin: "Central" },
};

export default function Home() {
  const [alerts, setAlerts] = useState<any>(null);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
        const res = await fetch(`${backendUrl}/api/alerts`);        const data = await res.json();
        setAlerts(data.data?.length > 0 ? data : null);
      } catch (e) { console.error("Backend Offline"); }
    };
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="h-screen bg-black text-white flex flex-col overflow-hidden font-sans">
      <nav className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
        <div className="flex items-center gap-2">
          <RadioTower className="text-red-500 animate-pulse" size={24} />
          <span className="font-black tracking-tighter text-xl uppercase italic">Iron Sight</span>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-80 border-r border-zinc-800 bg-zinc-950 overflow-y-auto p-4">
          <h2 className="text-[10px] font-bold text-zinc-500 tracking-widest mb-4 uppercase flex items-center gap-2">
             <ShieldAlert size={12} /> Live Threat Feed
          </h2>
          {alerts ? alerts.data.map((loc: string, i: number) => (
            <div key={i} className="bg-red-950/20 border border-red-500/30 p-4 rounded-xl mb-3 animate-in fade-in slide-in-from-left-2">
              <div className="text-red-500 font-bold text-lg">{loc}</div>
              <div className="text-[10px] text-red-400 opacity-60 font-mono">Origin: {ISRAEL_CITIES[loc]?.origin || "Determining..."}</div>
            </div>
          )) : <div className="text-zinc-700 text-xs italic text-center py-20 uppercase tracking-widest">Scanning Skies...</div>}
        </div>

        <div className="flex-1">
          <MapComponent alerts={alerts} cities={ISRAEL_CITIES} />
        </div>
      </div>
    </main>
  );
}
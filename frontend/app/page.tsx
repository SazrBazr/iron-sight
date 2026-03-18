"use client";
import dynamic from 'next/dynamic';
import React, { useState, useEffect } from 'react';
import { ShieldAlert, RadioTower, History, Map as MapIcon } from 'lucide-react';

// Load the Leaflet component ONLY on the client
const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-zinc-900 animate-pulse flex items-center justify-center text-zinc-500 font-mono tracking-tighter">INITIALIZING RADAR...</div>
});

export default function Home() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'live' | 'history'>('live');

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch(`${backendUrl}/api/alerts`);
        const data = await res.json();
        // Backend now returns { active: true, alerts: [...] }
        setAlerts(data.active ? data.alerts : []);
      } catch (e) { 
        console.error("Alert Fetch Failed"); 
      }
    };

    const fetchHistory = async () => {
      try {
        const res = await fetch(`${backendUrl}/api/history`);
        const data = await res.json();
        setHistory(Array.isArray(data) ? data : []);
      } catch (e) { 
        console.error("History Fetch Failed"); 
      }
    };

    fetchAlerts();
    fetchHistory();
    
    const alertInterval = setInterval(fetchAlerts, 2000);
    const historyInterval = setInterval(fetchHistory, 30000); // Refresh history every 30s

    return () => {
      clearInterval(alertInterval);
      clearInterval(historyInterval);
    };
  }, [backendUrl]);

  return (
    <main className="h-screen bg-black text-white flex flex-col overflow-hidden font-sans">
      {/* Navbar */}
      <nav className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950 z-10">
        <div className="flex items-center gap-2">
          <RadioTower className="text-red-500 animate-pulse" size={24} />
          <span className="font-black tracking-tighter text-xl uppercase italic">Iron Sight</span>
        </div>
        <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800">
          <button 
            onClick={() => setActiveTab('live')}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'live' ? 'bg-red-600 text-white' : 'text-zinc-500 hover:text-white'}`}
          >
            <ShieldAlert size={14} /> LIVE
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'history' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-white'}`}
          >
            <History size={14} /> 24H HISTORY
          </button>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 border-r border-zinc-800 bg-zinc-950 overflow-y-auto p-4 flex flex-col">
          <h2 className="text-[10px] font-bold text-zinc-500 tracking-widest mb-4 uppercase flex items-center gap-2">
             {activeTab === 'live' ? <RadioTower size={12} className="text-red-500" /> : <History size={12} />} 
             {activeTab === 'live' ? 'Live Threat Feed' : 'Last 24 Hours'}
          </h2>

          <div className="flex-1 space-y-3">
            {activeTab === 'live' ? (
              alerts.length > 0 ? alerts.map((alert: any, i: number) => (
                <div key={i} className="bg-red-950/20 border border-red-500/30 p-4 rounded-xl animate-in fade-in slide-in-from-left-2">
                  <div className="text-red-500 font-bold text-lg leading-tight">{alert.location}</div>
                  <div className="text-[10px] text-red-400 font-bold uppercase mt-1">{alert.type}</div>
                  <div className="text-[9px] text-zinc-500 mt-2 font-mono uppercase tracking-tighter">Status: {alert.origin}</div>
                </div>
              )) : (
                <div className="text-zinc-800 text-xs italic text-center py-20 uppercase tracking-widest animate-pulse">Scanning Skies...</div>
              )
            ) : (
              history.length > 0 ? history.slice(0, 50).map((item: any, i: number) => (
                <div key={i} className="bg-zinc-900/40 border border-zinc-800 p-3 rounded-lg flex justify-between items-start group hover:border-zinc-700 transition-colors">
                  <div>
                    <div className="text-zinc-200 font-bold text-sm">{item.location}</div>
                    <div className="text-[9px] text-zinc-500 uppercase mt-0.5">{item.type}</div>
                  </div>
                  <div className="text-[9px] font-mono text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded uppercase">{item.time}</div>
                </div>
              )) : (
                <div className="text-zinc-800 text-xs italic text-center py-20">No data for today</div>
              )
            )}
          </div>
        </div>

        {/* Map Area */}
        <div className="flex-1 relative">
          <MapComponent alerts={activeTab === 'live' ? alerts : []} history={activeTab === 'history' ? history : []} />
          
          {/* Overlay Status */}
          <div className="absolute bottom-6 right-6 z-[1000] bg-zinc-950/80 backdrop-blur-md border border-zinc-800 p-3 rounded-lg shadow-2xl">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${alerts.length > 0 ? 'bg-red-500 animate-ping' : 'bg-green-500'}`} />
              <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                System: <span className={alerts.length > 0 ? 'text-red-500' : 'text-green-500'}>{alerts.length > 0 ? 'ACTIVE THREAT' : 'SECURE'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
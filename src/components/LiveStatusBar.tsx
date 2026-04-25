"use client";

import { useState, useEffect } from "react";

export default function LiveStatusBar() {
  const [data, setData] = useState<{ temp: number; condition: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLiveStatus() {
      try {
        // Fetching live weather for Kanpur (example location for CampusCore)
        // using a free public API (Open-Meteo)
        const res = await fetch("https://api.open-meteo.com/v1/forecast?latitude=26.4499&longitude=80.3319&current_weather=true");
        const json = await res.json();
        const weather = json.current_weather;
        
        setData({
          temp: Math.round(weather.temperature),
          condition: getWeatherCondition(weather.weathercode),
        });
      } catch (err) {
        console.error("Live Status Fetch Failed:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchLiveStatus();
    const interval = setInterval(fetchLiveStatus, 300000); // Update every 5 mins
    return () => clearInterval(interval);
  }, []);

  function getWeatherCondition(code: number) {
    if (code === 0) return "Clear Sky";
    if (code <= 3) return "Partly Cloudy";
    if (code <= 48) return "Foggy";
    if (code <= 67) return "Rainy";
    if (code <= 77) return "Snowy";
    return "Overcast";
  }

  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md animate-slide-up">
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
        <span className="text-[10px] uppercase tracking-widest font-bold text-foreground/40">Network Live</span>
      </div>
      
      <div className="h-4 w-px bg-white/10" />
      
      {loading ? (
        <div className="flex gap-2">
          <div className="w-12 h-3 bg-white/5 rounded animate-pulse" />
          <div className="w-8 h-3 bg-white/5 rounded animate-pulse" />
        </div>
      ) : data ? (
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-white">{data.condition}</span>
          <span className="text-sm font-bold text-primary">{data.temp}&deg;C</span>
        </div>
      ) : (
        <span className="text-[10px] text-foreground/30">Campus Data Offline</span>
      )}
    </div>
  );
}

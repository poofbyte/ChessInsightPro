"use client";

import React, { useEffect, useState, useRef } from "react";
import { Activity, ServerCrash, Clock, MonitorPlay } from "lucide-react";

interface LiveEvent {
  event_id: string;
  event_type: string;
  category: string;
  timestamp: number;
  platform: string;
}

export default function LiveMonitoringDashboard() {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [status, setStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // Connect to SSE API
    const sse = new EventSource("/api/analytics/live");
    eventSourceRef.current = sse;

    sse.onopen = () => {
      setStatus("connected");
    };

    sse.onmessage = (message) => {
      if (message.data.includes("ping")) return; // heartbeat
      
      try {
        const payload = JSON.parse(message.data);
        if (payload.status === "connected") {
          setStatus("connected");
          return;
        }

        if (payload.events && Array.isArray(payload.events)) {
          setEvents((prev) => {
            // Keep only the latest 100 events to prevent memory leaks
            const updated = [...payload.events, ...prev];
            return updated.slice(0, 100);
          });
        }
      } catch (err) {
        console.error("Error parsing live event data:", err);
      }
    };

    sse.onerror = () => {
      setStatus("disconnected");
      sse.close();
    };

    return () => {
      sse.close();
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Live Monitoring</h1>
          <p className="text-slate-400 text-sm mt-1">Real-time telemetry firehose via Server-Sent Events.</p>
        </div>
        
        <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2 ${
          status === "connected" ? "bg-emerald-900/30 text-emerald-400" :
          status === "connecting" ? "bg-amber-900/30 text-amber-400" :
          "bg-rose-900/30 text-rose-400"
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            status === "connected" ? "bg-emerald-400 animate-pulse" :
            status === "connecting" ? "bg-amber-400" :
            "bg-rose-400"
          }`} />
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-500">
            <MonitorPlay className="w-12 h-12 mb-4 opacity-50" />
            <p>Waiting for events...</p>
            <p className="text-sm mt-2 opacity-75">When users interact with the app, events will stream here instantly.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400 bg-slate-950/50">
                  <th className="px-6 py-3 font-medium">Timestamp</th>
                  <th className="px-6 py-3 font-medium">Category</th>
                  <th className="px-6 py-3 font-medium">Event Type</th>
                  <th className="px-6 py-3 font-medium">Platform</th>
                  <th className="px-6 py-3 font-medium">Event ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {events.map((e) => (
                  <tr key={e.event_id} className="hover:bg-slate-800/30 transition-colors text-sm text-slate-300">
                    <td className="px-6 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {new Date(e.timestamp).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      <span className="px-2 py-1 bg-slate-800 text-xs rounded text-slate-300">
                        {e.category}
                      </span>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-indigo-400 font-medium">
                      {e.event_type}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      {e.platform}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-slate-500 text-xs font-mono">
                      {e.event_id.split("-")[0]}...
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

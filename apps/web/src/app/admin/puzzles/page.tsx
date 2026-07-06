"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/app/store";
import { Puzzle, Play, Search } from "lucide-react";

export default function AdminPuzzlesPage() {
  const { accessToken } = useAuthStore();
  const [puzzles, setPuzzles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mining, setMining] = useState(false);
  const [search, setSearch] = useState("");

  const fetchPuzzles = () => {
    if (!accessToken) return;
    fetch("/api/admin/puzzles", {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
      .then(res => res.json())
      .then(data => {
        setPuzzles(data.puzzles || []);
        setLoading(false);
      });
  };

  useEffect(() => { fetchPuzzles(); }, [accessToken]);

  const handleManualMining = async () => {
    if (!confirm("Are you sure you want to trigger puzzle mining now? This is intensive.")) return;
    
    setMining(true);
    try {
      const res = await fetch("/api/admin/puzzles", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      const data = await res.json();
      if (res.ok) {
        alert("Mining completed successfully!");
        fetchPuzzles();
      } else {
        alert(data.error || "Mining failed");
      }
    } catch (e) {
      console.error(e);
      alert("Error triggering mining");
    } finally {
      setMining(false);
    }
  };

  const filtered = puzzles.filter(p => 
    p.themes.toLowerCase().includes(search.toLowerCase()) || 
    p.id.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-black">Puzzle Pool</h1>
        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search themes or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-card border border-border rounded-xl py-2 pl-9 pr-4 text-sm outline-none focus:border-teal-500 transition-colors"
            />
          </div>
          <button
            onClick={handleManualMining}
            disabled={mining}
            className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition shadow-lg shadow-teal-500/20"
          >
            <Play className="w-4 h-4" />
            {mining ? "Mining..." : "Run Mining Now"}
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-black/5 dark:bg-slate-900 border-b border-border">
              <tr>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-wider text-xs">ID / Date</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Themes</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Rating</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Times Served</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Source Game</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">Loading puzzles...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">No puzzles found.</td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-black/5 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-xs text-slate-400">{p.id.split('-')[0]}...</div>
                      <div className="text-slate-500 text-xs mt-1">{new Date(p.generated_at).toLocaleDateString()}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {JSON.parse(p.themes).slice(0, 3).map((t: string) => (
                          <span key={t} className="px-2 py-0.5 bg-black/5 dark:bg-slate-800 text-xs font-bold rounded-md">
                            {t}
                          </span>
                        ))}
                        {JSON.parse(p.themes).length > 3 && <span className="text-xs text-slate-500">+{JSON.parse(p.themes).length - 3}</span>}
                      </div>
                    </td>
                    <td className="p-4 font-bold text-teal-400">{p.rating}</td>
                    <td className="p-4 font-medium">{p.times_served}</td>
                    <td className="p-4">
                      {p.source_game_url ? (
                        <a href={p.source_game_url} target="_blank" rel="noreferrer" className="text-teal-500 hover:underline text-xs font-bold">
                          View Game
                        </a>
                      ) : (
                        <span className="text-slate-500 text-xs italic">Unknown</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

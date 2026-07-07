"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuthStore } from "@/app/store";
import { Search, Filter, Eye, X, Calendar, Clock, RefreshCw, ShieldAlert } from "lucide-react";

interface ActivityLog {
  id: string;
  user_id: string;
  activity_type: string;
  activity_name: string;
  details: string;
  ip_address: string;
  created_at: string;
  email: string;
}

export default function AdminActivityLogsPage() {
  const { accessToken } = useAuthStore();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterUser, setFilterUser] = useState("");
  const [activityTypes, setActivityTypes] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const [error, setError] = useState("");

  const fetchLogs = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filterType) params.set("activityType", filterType);
      if (filterUser) params.set("userId", filterUser);
      params.set("page", String(page));

      const res = await fetch(`/api/admin/activity-logs?${params}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (res.ok) {
        setLogs(data.logs || []);
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || 0);
        setActivityTypes(data.activityTypes || []);
      } else setError(data.error || "Failed to load");
    } catch {
      setError("Failed to load activity logs");
    }
    setLoading(false);
  }, [accessToken, search, filterType, filterUser, page]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  useEffect(() => { setPage(1); }, [search, filterType, filterUser]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const activityLabel = (type: string) => {
    const labels: Record<string, string> = {
      game_review: "Game Review",
      puzzle_battle: "Puzzle Battle",
      puzzle_daily: "Daily Puzzle",
      puzzle_rush: "Puzzle Rush",
      puzzle_custom: "Custom Puzzle",
      lesson: "Lesson",
      coach: "Coach Play",
      training: "Training",
      learning: "Learning",
      page_view: "Page View",
    };
    return labels[type] || type.replace(/_/g, " ");
  };

  const activityColor = (type: string) => {
    const colors: Record<string, string> = {
      game_review: "bg-blue-500/10 text-blue-500",
      puzzle_battle: "bg-purple-500/10 text-purple-500",
      puzzle_daily: "bg-teal-500/10 text-teal-500",
      puzzle_rush: "bg-orange-500/10 text-orange-500",
      puzzle_custom: "bg-pink-500/10 text-pink-500",
      lesson: "bg-emerald-500/10 text-emerald-500",
      coach: "bg-amber-500/10 text-amber-500",
      training: "bg-cyan-500/10 text-cyan-500",
      learning: "bg-indigo-500/10 text-indigo-500",
    };
    return colors[type] || "bg-slate-500/10 text-slate-500";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black">Activity Logs</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">{total} total entries</p>
        </div>
        <button onClick={fetchLogs} className="p-2.5 bg-card border border-border rounded-xl hover:bg-black/5 dark:hover:bg-slate-800 transition">
          <RefreshCw className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold rounded-xl flex items-center gap-2">
          <ShieldAlert className="w-4 h-4" /> <span>{error}</span>
          <button onClick={() => setError("")} className="ml-auto"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text" placeholder="Search email, activity name..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-card border border-border rounded-xl py-2 pl-9 pr-4 text-sm outline-none focus:border-teal-500 transition-colors"
          />
        </div>
        <select
          value={filterType} onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 bg-card border border-border rounded-xl text-sm outline-none focus:border-teal-500"
        >
          <option value="">All Types</option>
          {activityTypes.map((t) => (
            <option key={t} value={t}>{activityLabel(t)}</option>
          ))}
        </select>
        <input
          type="text" placeholder="Filter by user ID"
          value={filterUser} onChange={(e) => setFilterUser(e.target.value)}
          className="w-48 px-3 py-2 bg-card border border-border rounded-xl text-sm outline-none focus:border-teal-500"
        />
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-black/5 dark:bg-slate-900 border-b border-border">
              <tr>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Date</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-wider text-xs">User</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Activity Type</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Name</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-wider text-xs">IP</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-500">Loading...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-500">No activity logs found.</td></tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-black/5 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-4 text-xs text-slate-500">{formatDate(log.created_at)}</td>
                    <td className="p-4 font-medium text-xs">{log.email}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${activityColor(log.activity_type)}`}>
                        {activityLabel(log.activity_type)}
                      </span>
                    </td>
                    <td className="p-4 text-xs">{log.activity_name || "—"}</td>
                    <td className="p-4 text-[10px] text-slate-500">{log.ip_address || "—"}</td>
                    <td className="p-4">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-500 rounded-lg transition"
                        title="View details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={page <= 1} onClick={() => setPage(page - 1)}
            className="px-3 py-1.5 bg-card border border-border rounded-lg text-sm font-bold disabled:opacity-40 hover:bg-black/5 dark:hover:bg-slate-800 transition"
          >
            Previous
          </button>
          <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
          <button
            disabled={page >= totalPages} onClick={() => setPage(page + 1)}
            className="px-3 py-1.5 bg-card border border-border rounded-lg text-sm font-bold disabled:opacity-40 hover:bg-black/5 dark:hover:bg-slate-800 transition"
          >
            Next
          </button>
        </div>
      )}

      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 !m-0" onClick={() => setSelectedLog(null)}>
          <div className="bg-card border border-border rounded-3xl w-full max-w-lg max-h-[80vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-black">Activity Details</h2>
              <button onClick={() => setSelectedLog(null)} className="p-2 bg-black/5 dark:bg-slate-800 rounded-full hover:bg-black/10 dark:hover:bg-slate-700 transition">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-black/5 dark:bg-slate-900 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">User</p>
                  <p className="text-sm font-bold mt-1">{selectedLog.email}</p>
                </div>
                <div className="p-3 bg-black/5 dark:bg-slate-900 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Activity Type</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold ${activityColor(selectedLog.activity_type)}`}>
                    {activityLabel(selectedLog.activity_type)}
                  </span>
                </div>
                <div className="p-3 bg-black/5 dark:bg-slate-900 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date & Time</p>
                  <p className="text-sm mt-1">{formatDate(selectedLog.created_at)}</p>
                </div>
                <div className="p-3 bg-black/5 dark:bg-slate-900 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">IP Address</p>
                  <p className="text-sm mt-1">{selectedLog.ip_address || "—"}</p>
                </div>
              </div>
              {selectedLog.activity_name && (
                <div className="p-3 bg-black/5 dark:bg-slate-900 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Activity Name</p>
                  <p className="text-sm font-bold mt-1">{selectedLog.activity_name}</p>
                </div>
              )}
              {selectedLog.details && (() => {
                try {
                  const details = JSON.parse(selectedLog.details);
                  return (
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Details</p>
                      <div className="bg-black/5 dark:bg-slate-900 border border-border rounded-xl p-4 space-y-2">
                        {Object.entries(details).map(([key, value]) => (
                          <div key={key} className="flex justify-between items-center py-1 border-b border-border/50 last:border-0">
                            <span className="text-xs font-bold text-slate-500 capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                            <span className="text-xs font-semibold text-foreground">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                } catch {
                  return (
                    <div className="p-3 bg-black/5 dark:bg-slate-900 rounded-xl">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Details (raw)</p>
                      <pre className="text-xs text-slate-500 whitespace-pre-wrap">{selectedLog.details}</pre>
                    </div>
                  );
                }
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

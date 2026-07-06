"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/app/store";
import { ShieldAlert, Search } from "lucide-react";

export default function AdminAuditLogPage() {
  const { accessToken } = useAuthStore();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!accessToken) return;
    fetch("/api/admin/audit-log", {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
      .then(res => res.json())
      .then(data => {
        setLogs(data.logs || []);
        setLoading(false);
      });
  }, [accessToken]);

  const filtered = logs.filter(l => 
    l.action.toLowerCase().includes(search.toLowerCase()) || 
    (l.admin_email && l.admin_email.toLowerCase().includes(search.toLowerCase())) ||
    (l.target_type && l.target_type.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">Audit Log</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Track admin actions and configuration changes.</p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search action or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-card border border-border rounded-xl py-2 pl-9 pr-4 text-sm outline-none focus:border-teal-500 transition-colors"
          />
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-black/5 dark:bg-slate-900 border-b border-border">
              <tr>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Timestamp</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Admin</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Action</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Target</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">Loading audit log...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">No logs found.</td>
                </tr>
              ) : (
                filtered.map((l) => (
                  <tr key={l.id} className="hover:bg-black/5 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-4 text-slate-500 whitespace-nowrap">{new Date(l.created_at).toLocaleString()}</td>
                    <td className="p-4 font-medium">{l.admin_email || "System"}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-teal-500/10 text-teal-500 text-xs font-bold rounded-md uppercase tracking-wide">
                        {l.action}
                      </span>
                    </td>
                    <td className="p-4">
                      {l.target_type && (
                        <div className="flex flex-col">
                          <span className="text-xs font-bold">{l.target_type}</span>
                          <span className="text-xs text-slate-500 font-mono truncate max-w-[150px]">{l.target_id}</span>
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      {l.details ? (
                        <pre className="text-[10px] font-mono text-slate-600 dark:text-slate-400 bg-black/5 dark:bg-slate-900 p-2 rounded-lg max-w-sm overflow-x-auto">
                          {(() => {
                            try { return JSON.stringify(JSON.parse(l.details), null, 2); }
                            catch { return l.details; }
                          })()}
                        </pre>
                      ) : (
                        <span className="text-slate-500 italic text-xs">No details</span>
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

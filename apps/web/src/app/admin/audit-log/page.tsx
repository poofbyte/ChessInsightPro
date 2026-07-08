"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/app/store";
import { ShieldAlert, Search } from "lucide-react";
import { ResponsiveTable } from "@/components/ui/ResponsiveTable";

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

      <ResponsiveTable
        headers={["Timestamp", "Admin", "Action", "Target", "Details"]}
        data={filtered}
        keyExtractor={(l) => l.id}
        renderRow={(l, isMobile) => {
          const actionBadge = (
            <span className="px-2 py-1 bg-teal-500/10 text-teal-500 text-xs font-bold rounded-md uppercase tracking-wide">
              {l.action}
            </span>
          );

          const targetInfo = l.target_type && (
            <div className="flex flex-col">
              <span className="text-xs font-bold">{l.target_type}</span>
              <span className="text-xs text-slate-500 font-mono truncate max-w-[150px]">{l.target_id}</span>
            </div>
          );

          const detailsInfo = l.details ? (
            <pre className="text-xs font-mono text-slate-600 dark:text-slate-400 bg-black/5 dark:bg-slate-900 p-2 rounded-lg max-w-[200px] overflow-x-auto">
              {(() => {
                try { return JSON.stringify(JSON.parse(l.details), null, 2); }
                catch { return l.details; }
              })()}
            </pre>
          ) : (
            <span className="text-slate-500 italic text-xs">No details</span>
          );

          if (isMobile) {
            return (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  {actionBadge}
                  <span className="text-xs text-slate-500">{new Date(l.created_at).toLocaleString()}</span>
                </div>
                <div className="text-sm">
                  <span className="font-bold">Admin: </span> {l.admin_email || "System"}
                </div>
                {targetInfo && (
                  <div className="text-sm">
                    <span className="font-bold">Target: </span>
                    {targetInfo}
                  </div>
                )}
                <div className="text-sm">
                  <span className="font-bold">Details: </span>
                  {detailsInfo}
                </div>
              </div>
            );
          }

          return (
            <>
              <td className="p-4 text-slate-500 whitespace-nowrap">{new Date(l.created_at).toLocaleString()}</td>
              <td className="p-4 font-medium">{l.admin_email || "System"}</td>
              <td className="p-4">{actionBadge}</td>
              <td className="p-4">{targetInfo}</td>
              <td className="p-4">{detailsInfo}</td>
            </>
          );
        }}
      />
    </div>
  );
}

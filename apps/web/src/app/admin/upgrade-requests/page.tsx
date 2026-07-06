"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/app/store";
import { Check, X, Clock, Search } from "lucide-react";

export default function AdminUpgradeRequestsPage() {
  const { accessToken } = useAuthStore();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("PENDING");

  const fetchRequests = () => {
    if (!accessToken) return;
    fetch("/api/admin/upgrade-requests", {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
      .then(res => res.json())
      .then(data => {
        setRequests(data.requests || []);
        setLoading(false);
      });
  };

  useEffect(() => { fetchRequests(); }, [accessToken]);

  const handleAction = async (requestId: string, action: "APPROVE" | "REJECT") => {
    if (!confirm(`Are you sure you want to ${action} this request?`)) return;
    
    try {
      const res = await fetch("/api/admin/upgrade-requests", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ requestId, action })
      });
      
      if (res.ok) fetchRequests();
      else alert("Action failed");
    } catch (e) {
      console.error(e);
      alert("Error processing action");
    }
  };

  const filtered = filter === "ALL" ? requests : requests.filter(r => r.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black">Billing Queue</h1>
        <div className="flex gap-2 bg-card border border-border p-1 rounded-xl">
          {["ALL", "PENDING", "APPROVED", "REJECTED"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                filter === f ? "bg-teal-500 text-white shadow-md" : "text-slate-500 hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-black/5 dark:bg-slate-900 border-b border-border">
              <tr>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Date</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-wider text-xs">User Email</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Plan Requested</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Price (BDT)</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Status</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">Loading requests...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">No requests found.</td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-black/5 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-4 text-slate-500">{new Date(r.created_at).toLocaleString()}</td>
                    <td className="p-4 font-medium">{r.user_email}</td>
                    <td className="p-4 font-bold text-teal-400">
                      {r.requested_plan === "TIER1" ? "Pro" : r.requested_plan === "TIER2" ? "Elite" : "Custom"}
                      {r.requested_quotas && <div className="text-xs text-slate-500 font-normal mt-1">{r.requested_quotas}</div>}
                    </td>
                    <td className="p-4 font-black">{r.requested_price_bdt}</td>
                    <td className="p-4">
                      {r.status === "PENDING" && <span className="flex items-center gap-1 text-amber-500 text-xs font-bold"><Clock className="w-3 h-3" /> Pending</span>}
                      {r.status === "APPROVED" && <span className="flex items-center gap-1 text-emerald-500 text-xs font-bold"><Check className="w-3 h-3" /> Approved</span>}
                      {r.status === "REJECTED" && <span className="flex items-center gap-1 text-rose-500 text-xs font-bold"><X className="w-3 h-3" /> Rejected</span>}
                    </td>
                    <td className="p-4">
                      {r.status === "PENDING" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAction(r.id, "APPROVE")}
                            className="p-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 rounded-lg transition"
                            title="Approve"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleAction(r.id, "REJECT")}
                            className="p-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 rounded-lg transition"
                            title="Reject"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
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

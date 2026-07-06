"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/app/store";
import { Check, X, Clock, Eye } from "lucide-react";

export default function AdminUpgradeRequestsPage() {
  const { accessToken } = useAuthStore();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

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
    setProcessingId(requestId);
    try {
      const res = await fetch("/api/admin/upgrade-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ requestId, action })
      });

      if (res.ok) {
        fetchRequests();
        if (selectedRequest?.id === requestId) setSelectedRequest(null);
      } else {
        const err = await res.json();
        alert(err.error || "Action failed");
      }
    } catch (e) {
      console.error(e);
      alert("Error processing action");
    }
    setProcessingId(null);
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
                  <tr
                    key={r.id}
                    className={`transition-colors ${
                      r.status === "PENDING"
                        ? "cursor-pointer hover:bg-teal-500/5"
                        : "opacity-60"
                    }`}
                    onClick={() => r.status === "PENDING" && setSelectedRequest(r)}
                  >
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
                      {r.status === "PENDING" ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-teal-500 font-bold flex items-center gap-1">
                            <Eye className="w-3 h-3" /> Review
                          </span>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleAction(r.id, "APPROVE"); }}
                            disabled={processingId === r.id}
                            className="p-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 rounded-lg transition disabled:opacity-40"
                            title="Approve"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleAction(r.id, "REJECT"); }}
                            disabled={processingId === r.id}
                            className="p-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 rounded-lg transition disabled:opacity-40"
                            title="Reject"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-500 italic">Processed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Request Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setSelectedRequest(null)}>
          <div className="bg-card border border-border rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-xl font-black">Upgrade Request Details</h2>
              <button onClick={() => setSelectedRequest(null)} className="p-2 bg-black/5 dark:bg-slate-800 rounded-full hover:bg-black/10 dark:hover:bg-slate-700 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-black/5 dark:bg-slate-900 rounded-2xl">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">User</p>
                  <p className="font-bold">{selectedRequest.user_email}</p>
                </div>
                <div className="p-4 bg-black/5 dark:bg-slate-900 rounded-2xl">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Requested Plan</p>
                  <p className="font-bold">{selectedRequest.requested_plan === "TIER1" ? "Pro" : selectedRequest.requested_plan === "TIER2" ? "Elite" : "Custom"}</p>
                </div>
                <div className="p-4 bg-black/5 dark:bg-slate-900 rounded-2xl">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Price</p>
                  <p className="font-bold text-teal-500">{selectedRequest.requested_price_bdt} BDT</p>
                </div>
                <div className="p-4 bg-black/5 dark:bg-slate-900 rounded-2xl">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Status</p>
                  <span className={`inline-block px-2.5 py-1 text-[10px] font-bold rounded-full ${
                    selectedRequest.status === 'PENDING' ? 'bg-orange-500/10 text-orange-500' :
                    selectedRequest.status === 'APPROVED' ? 'bg-teal-500/10 text-teal-500' :
                    'bg-rose-500/10 text-rose-500'
                  }`}>{selectedRequest.status}</span>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Verification Information</p>
                {selectedRequest.verification_details ? (
                  <div className="bg-black/5 dark:bg-slate-900 border border-border rounded-2xl p-4 space-y-3">
                    {(() => {
                      try {
                        const details = JSON.parse(selectedRequest.verification_details);
                        return Object.entries(details).map(([key, value]) => (
                          <div key={key} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                            <span className="text-sm font-bold text-slate-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                            <span className="text-sm font-semibold text-foreground">{String(value)}</span>
                          </div>
                        ));
                      } catch {
                        return (
                          <pre className="whitespace-pre-wrap text-xs text-slate-500">
                            {selectedRequest.verification_details}
                          </pre>
                        );
                      }
                    })()}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic">No verification information provided.</p>
                )}
              </div>

              {selectedRequest.requested_quotas && (
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Requested Quotas</p>
                  <div className="bg-black/5 dark:bg-slate-900 border border-border rounded-2xl p-4">
                    {(() => {
                      try {
                        const quotas = JSON.parse(selectedRequest.requested_quotas);
                        return Object.entries(quotas).map(([key, value]) => (
                          <div key={key} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                            <span className="text-sm font-bold text-slate-500 capitalize">{key}</span>
                            <span className="text-sm font-semibold text-foreground">{String(value)}</span>
                          </div>
                        ));
                      } catch {
                        return <pre className="whitespace-pre-wrap text-xs">{selectedRequest.requested_quotas}</pre>;
                      }
                    })()}
                  </div>
                </div>
              )}

              {selectedRequest.created_at && (
                <div className="p-4 bg-black/5 dark:bg-slate-900 rounded-2xl">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Submitted At</p>
                  <p className="text-sm">{new Date(selectedRequest.created_at).toLocaleString()}</p>
                </div>
              )}

              {selectedRequest.status === "PENDING" && (
                <div className="flex gap-4 pt-4 border-t border-border">
                  <button
                    onClick={() => handleAction(selectedRequest.id, "APPROVE")}
                    disabled={processingId === selectedRequest.id}
                    className="flex-1 py-3 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white font-bold rounded-xl transition flex items-center justify-center gap-2"
                  >
                    {processingId === selectedRequest.id ? "Processing..." : <><Check className="w-4 h-4" /> Approve & Upgrade</>}
                  </button>
                  <button
                    onClick={() => handleAction(selectedRequest.id, "REJECT")}
                    disabled={processingId === selectedRequest.id}
                    className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-bold rounded-xl transition flex items-center justify-center gap-2"
                  >
                    {processingId === selectedRequest.id ? "Processing..." : <><X className="w-4 h-4" /> Reject</>}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

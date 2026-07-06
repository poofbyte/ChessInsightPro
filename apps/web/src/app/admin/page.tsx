"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/app/store";
import { Users, Gamepad2, Puzzle, TrendingUp, Settings, ListCollapse, Check, X, Eye, ExternalLink } from "lucide-react";

export default function AdminDashboardPage() {
  const { accessToken, user } = useAuthStore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"dashboard" | "requests" | "settings">("dashboard");
  const [stats, setStats] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [settings, setSettings] = useState({ payment_instructions: "", verification_fields: "[]", upgrade_success_message: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const parsedVerificationDetails = useMemo(() => {
    if (!selectedRequest?.verification_details) return null;
    try { return JSON.parse(selectedRequest.verification_details); } catch { return null; }
  }, [selectedRequest?.verification_details]);

  const parsedRequestedQuotas = useMemo(() => {
    if (!selectedRequest?.requested_quotas) return null;
    try { return JSON.parse(selectedRequest.requested_quotas); } catch { return null; }
  }, [selectedRequest?.requested_quotas]);

  // Client-side guard: redirect non-admin users away
  useEffect(() => {
    // Wait a tick for Zustand to rehydrate from storage
    const timeout = setTimeout(() => {
      if (!accessToken || user?.role !== "ADMIN") {
        router.replace("/");
      }
    }, 100);
    return () => clearTimeout(timeout);
  }, [accessToken, user, router]);

  useEffect(() => {
    if (!accessToken || user?.role !== "ADMIN") return;
    
    Promise.all([
      fetch("/api/admin/dashboard", { headers: { Authorization: `Bearer ${accessToken}` } }).then(res => res.json()),
      fetch("/api/admin/upgrade-requests", { headers: { Authorization: `Bearer ${accessToken}` } }).then(res => res.json()),
      fetch("/api/admin/settings", { headers: { Authorization: `Bearer ${accessToken}` } }).then(res => res.json())
    ]).then(([dashboardData, requestsData, settingsData]) => {
      setStats(dashboardData.stats);
      if (requestsData.requests) setRequests(requestsData.requests);
      if (settingsData) setSettings({
        payment_instructions: settingsData.payment_instructions || "",
        verification_fields: settingsData.verification_fields || "[]",
        upgrade_success_message: settingsData.upgrade_success_message || ""
      });
      setLoading(false);
    }).catch(err => {
      console.error("Admin data load error:", err);
      setLoading(false);
    });
  }, [accessToken, user]);

  const handleProcessRequest = async (id: string, action: "APPROVE" | "REJECT") => {
    setProcessingId(id);
    try {
      const res = await fetch("/api/admin/upgrade-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ requestId: id, action })
      });
      if (res.ok) {
        setRequests(requests.map(r => r.id === id ? { ...r, status: action === "APPROVE" ? "APPROVED" : "REJECTED" } : r));
        if (selectedRequest?.id === id) setSelectedRequest(null);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to process request.");
      }
    } catch (e) {
      console.error(e);
      alert("An error occurred.");
    }
    setProcessingId(null);
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(settings)
      });
      alert("Settings saved successfully!");
    } catch (e) {
      console.error(e);
      alert("Failed to save settings.");
    }
    setSaving(false);
  };

  if (loading || !stats) {
    return <div className="p-8 text-slate-500">Loading admin panel...</div>;
  }

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-background">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-black">Admin Panel</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">Manage users, view metrics, and configure settings.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-border pb-px">
          {[
            { id: "dashboard", label: "Dashboard", icon: TrendingUp },
            { id: "requests", label: "Upgrade Requests", icon: ListCollapse },
            { id: "settings", label: "Settings", icon: Settings },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 font-bold text-sm border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-teal-500 text-teal-600 dark:text-teal-400"
                  : "border-transparent text-slate-500 hover:text-foreground"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.id === "requests" && requests.filter(r => r.status === "PENDING").length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-rose-500 text-white text-[10px] rounded-full">
                  {requests.filter(r => r.status === "PENDING").length}
                </span>
              )}
            </button>
          ))}
        </div>

        {activeTab === "dashboard" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* MRR */}
              <div className="p-6 bg-gradient-to-br from-teal-500/20 to-emerald-500/5 border border-teal-500/30 rounded-2xl">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-teal-500/20 rounded-lg"><TrendingUp className="w-5 h-5 text-teal-500" /></div>
                  <p className="font-bold text-sm text-teal-600 dark:text-teal-400 uppercase tracking-widest">Est. MRR</p>
                </div>
                <p className="text-3xl font-black text-foreground">{stats.estimatedMrr} <span className="text-sm text-slate-500">BDT</span></p>
              </div>

              {/* Users */}
              <div className="p-6 bg-card border border-border rounded-2xl">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-500/10 rounded-lg"><Users className="w-5 h-5 text-blue-500" /></div>
                  <p className="font-bold text-sm text-slate-500 uppercase tracking-widest">Total Users</p>
                </div>
                <p className="text-3xl font-black text-foreground">{stats.totalUsers}</p>
              </div>

              {/* Games */}
              <div className="p-6 bg-card border border-border rounded-2xl">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-purple-500/10 rounded-lg"><Gamepad2 className="w-5 h-5 text-purple-500" /></div>
                  <p className="font-bold text-sm text-slate-500 uppercase tracking-widest">Games Analyzed</p>
                </div>
                <p className="text-3xl font-black text-foreground">{stats.totalGames}</p>
              </div>

              {/* Puzzles */}
              <div className="p-6 bg-card border border-border rounded-2xl">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-orange-500/10 rounded-lg"><Puzzle className="w-5 h-5 text-orange-500" /></div>
                  <p className="font-bold text-sm text-slate-500 uppercase tracking-widest">Total Puzzles</p>
                </div>
                <p className="text-3xl font-black text-foreground">{stats.totalPuzzles}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-card border border-border rounded-2xl p-6">
                <h2 className="text-lg font-bold mb-4">Paid Subscriptions</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-black/5 dark:bg-slate-900 rounded-xl">
                    <span className="font-bold">Pro (Tier 1)</span>
                    <span className="text-xl font-black text-teal-500">{stats.tier1}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-black/5 dark:bg-slate-900 rounded-xl">
                    <span className="font-bold">Elite (Tier 2)</span>
                    <span className="text-xl font-black text-teal-500">{stats.tier2}</span>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl p-6">
                <h2 className="text-lg font-bold mb-4">Puzzle Pool Health</h2>
                <div className="space-y-4">
                  <div className="p-4 bg-black/5 dark:bg-slate-900 rounded-xl">
                    <p className="text-sm text-slate-500 mb-1">Total Generated Puzzles</p>
                    <p className="text-2xl font-black">{stats.totalPuzzles}</p>
                  </div>
                  <div className="p-4 bg-black/5 dark:bg-slate-900 rounded-xl">
                    <p className="text-sm text-slate-500 mb-1">Avg. Times Served</p>
                    <p className="text-2xl font-black">{stats.avgPuzzleServed}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "requests" && (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-black/5 dark:bg-slate-900 text-slate-500 uppercase text-[10px] font-black tracking-widest">
                  <tr>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Requested Plan</th>
                    <th className="px-6 py-4">Price</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {requests.map((r: any) => (
                    <tr
                      key={r.id}
                      className={`transition-colors ${
                        r.status === "PENDING"
                          ? "cursor-pointer hover:bg-teal-500/5"
                          : "opacity-60"
                      }`}
                      onClick={() => r.status === "PENDING" && setSelectedRequest(r)}
                    >
                      <td className="px-6 py-4 font-bold">{r.user_email}</td>
                      <td className="px-6 py-4">{r.requested_plan}</td>
                      <td className="px-6 py-4 font-bold">{r.requested_price_bdt} BDT</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${
                          r.status === 'PENDING' ? 'bg-orange-500/10 text-orange-500' :
                          r.status === 'APPROVED' ? 'bg-teal-500/10 text-teal-500' :
                          'bg-rose-500/10 text-rose-500'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {r.status === "PENDING" ? (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-teal-500 font-bold flex items-center gap-1">
                              <Eye className="w-3 h-3" /> Review
                            </span>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleProcessRequest(r.id, "APPROVE"); }}
                              disabled={processingId === r.id}
                              className="p-1.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-600 rounded-lg disabled:opacity-40"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleProcessRequest(r.id, "REJECT"); }}
                              disabled={processingId === r.id}
                              className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 rounded-lg disabled:opacity-40"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-500 italic">Processed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {requests.length === 0 && (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500 italic">No upgrade requests found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
            <h2 className="text-xl font-black mb-6">Payment Configuration</h2>
            
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Payment Instructions (Markdown/Text)</p>
              <textarea
                value={settings.payment_instructions}
                onChange={e => setSettings({ ...settings, payment_instructions: e.target.value })}
                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/50 min-h-[150px]"
                placeholder="Enter instructions for users to make payments (e.g. bKash number)"
              />
            </div>
            
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Verification Fields JSON</p>
              <textarea
                value={settings.verification_fields}
                onChange={e => setSettings({ ...settings, verification_fields: e.target.value })}
                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-foreground font-mono text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/50 min-h-[200px]"
                placeholder='[{"id":"trxId", "label":"Transaction ID", "required":true}]'
              />
              <p className="text-xs text-slate-500 mt-2">Example: <code>{`[{"id":"trxId", "label":"Transaction ID", "required":true}]`}</code></p>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Upgrade Success Message</p>
              <textarea
                value={settings.upgrade_success_message}
                onChange={e => setSettings({ ...settings, upgrade_success_message: e.target.value })}
                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/50 min-h-[100px]"
                placeholder="Message shown after user submits an upgrade request"
              />
            </div>
            
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="px-6 py-2.5 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white font-bold rounded-xl transition"
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        )}
      </div>

      {/* Request Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setSelectedRequest(null)}>
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
                  <p className="font-bold">{selectedRequest.requested_plan}</p>
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
                    {parsedVerificationDetails ? (
                      Object.entries(parsedVerificationDetails).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                          <span className="text-sm font-bold text-slate-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                          <span className="text-sm font-semibold text-foreground">{String(value)}</span>
                        </div>
                      ))
                    ) : (
                      <pre className="whitespace-pre-wrap text-xs text-slate-500">
                        {selectedRequest.verification_details}
                      </pre>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic">No verification information provided.</p>
                )}
              </div>

              {selectedRequest.requested_quotas && (
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Requested Quotas</p>
                  <div className="bg-black/5 dark:bg-slate-900 border border-border rounded-2xl p-4">
                    {parsedRequestedQuotas ? (
                      Object.entries(parsedRequestedQuotas).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                          <span className="text-sm font-bold text-slate-500 capitalize">{key}</span>
                          <span className="text-sm font-semibold text-foreground">{String(value)}</span>
                        </div>
                      ))
                    ) : (
                      <pre className="whitespace-pre-wrap text-xs">{selectedRequest.requested_quotas}</pre>
                    )}
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
                    onClick={() => handleProcessRequest(selectedRequest.id, "APPROVE")}
                    disabled={processingId === selectedRequest.id}
                    className="flex-1 py-3 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white font-bold rounded-xl transition flex items-center justify-center gap-2"
                  >
                    {processingId === selectedRequest.id ? "Processing..." : <><Check className="w-4 h-4" /> Approve & Upgrade</>}
                  </button>
                  <button
                    onClick={() => handleProcessRequest(selectedRequest.id, "REJECT")}
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

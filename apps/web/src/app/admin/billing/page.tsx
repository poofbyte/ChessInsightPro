"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuthStore } from "@/app/store";
import { RefreshCw, Calendar, Clock, X, ShieldAlert } from "lucide-react";

interface Subscription {
  id: string;
  email: string;
  plan: string;
  customQuotas: string | null;
  planRenewsAt: string | null;
  planStartedAt: string | null;
  daysRemaining: number;
  isExpired: boolean;
}

export default function AdminBillingPage() {
  const { accessToken } = useAuthStore();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [extendDays, setExtendDays] = useState<Record<string, string>>({});
  const [editingExpiry, setEditingExpiry] = useState<string | null>(null);
  const [expiryInput, setExpiryInput] = useState("");

  const fetchSubscriptions = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/billing", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (res.ok) setSubscriptions(data.subscriptions || []);
      else setError(data.error || "Failed to load");
    } catch {
      setError("Failed to load subscriptions");
    }
    setLoading(false);
  }, [accessToken]);

  useEffect(() => { fetchSubscriptions(); }, [fetchSubscriptions]);

  const doAction = async (userId: string, action: string, extra: Record<string, any> = {}) => {
    setActionLoading(userId);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/admin/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ userId, action, ...extra }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("Action completed");
        fetchSubscriptions();
      } else {
        setError(data.error || "Action failed");
      }
    } catch {
      setError("Request failed");
    }
    setActionLoading(null);
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric",
    });
  };

  const planLabel = (plan: string) => {
    switch (plan) {
      case "TIER1": return "Pro";
      case "TIER2": return "Elite";
      case "CUSTOM": return "Custom";
      default: return plan;
    }
  };

  const planColor = (plan: string) => {
    switch (plan) {
      case "TIER1": return "bg-teal-500/10 text-teal-500";
      case "TIER2": return "bg-purple-500/10 text-purple-500";
      case "CUSTOM": return "bg-amber-500/10 text-amber-500";
      default: return "bg-slate-500/10 text-slate-500";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black">Billing Management</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
            {subscriptions.length} active {subscriptions.length === 1 ? "subscription" : "subscriptions"}
          </p>
        </div>
        <button
          onClick={fetchSubscriptions}
          className="p-2.5 bg-card border border-border rounded-xl hover:bg-black/5 dark:hover:bg-slate-800 transition"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold rounded-xl flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError("")} className="ml-auto"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}
      {success && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-xl flex items-center gap-2">
          <span>{success}</span>
          <button onClick={() => setSuccess("")} className="ml-auto"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-black/5 dark:bg-slate-900 border-b border-border">
              <tr>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-wider text-xs">User</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Plan</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Started</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Expires</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Status</th>
                <th className="p-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">Loading subscriptions...</td>
                </tr>
              ) : subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">No paid subscriptions found.</td>
                </tr>
              ) : (
                subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-black/5 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-4 font-medium">{sub.email}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${planColor(sub.plan)}`}>
                        {planLabel(sub.plan)}
                      </span>
                      {sub.customQuotas && (
                        <span className="ml-2 text-xs text-slate-500">(custom quotas)</span>
                      )}
                    </td>
                    <td className="p-4 text-slate-500 text-xs flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" />
                      {formatDate(sub.planStartedAt)}
                    </td>
                    <td className="p-4 text-xs">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {editingExpiry === sub.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="date"
                              value={expiryInput}
                              onChange={(e) => setExpiryInput(e.target.value)}
                              className="w-32 px-1.5 py-1 bg-background border border-border rounded text-xs"
                            />
                            <button
                              onClick={() => {
                                if (expiryInput) {
                                  doAction(sub.id, "set_expiry", { expiresAt: new Date(expiryInput + "T23:59:59").toISOString() });
                                  setEditingExpiry(null);
                                }
                              }}
                              className="text-teal-500 hover:text-teal-400 text-xs font-bold"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingExpiry(null)}
                              className="text-slate-500 hover:text-slate-400 text-xs"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <span>{formatDate(sub.planRenewsAt)}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      {sub.isExpired ? (
                        <span className="flex items-center gap-1 text-rose-500 text-xs font-bold">
                          <Clock className="w-3 h-3" /> Expired
                        </span>
                      ) : sub.daysRemaining <= 7 ? (
                        <span className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                          <Clock className="w-3 h-3" /> {sub.daysRemaining}d remaining
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-emerald-500 text-xs font-bold">
                          <Clock className="w-3 h-3" /> Active
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="1"
                            max="365"
                            placeholder="days"
                            value={extendDays[sub.id] || ""}
                            onChange={(e) => setExtendDays({ ...extendDays, [sub.id]: e.target.value })}
                            className="w-16 px-1.5 py-1 bg-background border border-border rounded text-xs text-center"
                          />
                          <button
                            onClick={() => {
                              const days = parseInt(extendDays[sub.id] || "0");
                              if (days > 0) doAction(sub.id, "extend", { days });
                            }}
                            disabled={actionLoading === sub.id || !extendDays[sub.id]}
                            className="px-2 py-1 bg-teal-500/10 hover:bg-teal-500/20 text-teal-500 text-xs font-bold rounded-lg disabled:opacity-40"
                          >
                            Extend
                          </button>
                        </div>

                        <div className="flex items-center gap-1 pl-2 border-l border-border">
                          <select
                            value=""
                            onChange={(e) => {
                              if (e.target.value) doAction(sub.id, "set_plan", { plan: e.target.value });
                              e.target.value = "";
                            }}
                            className="w-20 px-1.5 py-1 bg-background border border-border rounded text-xs"
                          >
                            <option value="" disabled>Plan</option>
                            <option value="TIER1">Pro</option>
                            <option value="TIER2">Elite</option>
                            <option value="CUSTOM">Custom</option>
                          </select>
                          <button
                            onClick={() => {
                              setEditingExpiry(sub.id);
                              setExpiryInput(sub.planRenewsAt ? new Date(sub.planRenewsAt).toISOString().split("T")[0] : "");
                            }}
                            className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 text-xs font-bold rounded-lg"
                            title="Set expiry date"
                          >
                            <Calendar className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Remove subscription for ${sub.email}?`)) doAction(sub.id, "remove");
                            }}
                            disabled={actionLoading === sub.id}
                            className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-xs font-bold rounded-lg disabled:opacity-40"
                            title="Remove subscription"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
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

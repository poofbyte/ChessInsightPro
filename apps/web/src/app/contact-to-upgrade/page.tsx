"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/app/store";
import { Phone, Mail, Clock, CheckCircle2, AlertTriangle, ArrowLeft } from "lucide-react";

export default function ContactToUpgradePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    fetch("/api/user/upgrade-requests")
      .then(res => res.json())
      .then(data => {
        setRequests(data.requests || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [user, router]);

  if (loading) {
    return <div className="flex-1 p-8 flex items-center justify-center">Loading...</div>;
  }

  // Find the most recent pending request
  const pending = requests.find(r => r.status === "PENDING");

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-background flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl bg-card border border-border rounded-3xl p-8 md:p-12 shadow-2xl relative">
        <button
          onClick={() => router.push("/pricing")}
          className="absolute top-8 left-8 p-2 rounded-full hover:bg-black/5 dark:hover:bg-slate-800 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="text-center mb-10 mt-8 md:mt-0">
          <div className="w-16 h-16 bg-teal-500/10 border border-teal-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-teal-400" />
          </div>
          <h1 className="text-3xl font-black mb-2">Upgrade Request Received</h1>
          <p className="text-slate-600 dark:text-slate-400">
            You're one step away from unlocking premium features.
          </p>
        </div>

        {pending ? (
          <div className="space-y-8">
            <div className="p-6 bg-black/5 dark:bg-slate-900 border border-border rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Selected Plan</p>
                <p className="text-xl font-bold">{pending.requested_plan === "TIER1" ? "Pro (Tier 1)" : pending.requested_plan === "TIER2" ? "Elite (Tier 2)" : "Custom Plan"}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total</p>
                <p className="text-2xl font-black text-teal-500">{pending.requested_price_bdt} BDT</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-lg">Next Steps:</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                We are currently processing payments manually. To complete your upgrade, please send the payment via Bkash, Nagad, or Bank Transfer, and contact us with your account email (<span className="font-bold text-foreground">{user?.email}</span>).
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="p-4 border border-border rounded-xl flex items-start gap-4 bg-card">
                  <Phone className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">WhatsApp / Call</p>
                    {/* Read from env temporarily, will be system config later */}
                    <p className="font-bold">{process.env.NEXT_PUBLIC_CONTACT_PHONE || "+880 1234 567890"}</p>
                  </div>
                </div>
                
                <div className="p-4 border border-border rounded-xl flex items-start gap-4 bg-card">
                  <Mail className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Email</p>
                    <p className="font-bold">{process.env.NEXT_PUBLIC_CONTACT_EMAIL || "billing@chessinsight.pro"}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-start gap-3">
              <Clock className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-blue-500">Estimated turnaround time: 1-2 hours</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Once we verify your payment, your account quotas will be instantly updated. You can check back here or your Profile page to see your status.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center p-8 bg-black/5 dark:bg-slate-900 border border-border rounded-2xl">
            <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400 font-medium">You don't have any pending upgrade requests right now.</p>
          </div>
        )}
      </div>
    </div>
  );
}

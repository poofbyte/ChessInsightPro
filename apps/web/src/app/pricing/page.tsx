"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Star } from "lucide-react";
import { calculateCustomPrice } from "@core/pricing";
import { useAuthStore } from "@/app/store";

export default function PricingPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  
  const [reviews, setReviews] = useState(100);
  const [sessions, setSessions] = useState(50);
  const [isCalculating, setIsCalculating] = useState(false);

  const customPrice = Math.round(calculateCustomPrice(reviews, sessions));

  const handleSelectPlan = async (plan: string, customPriceBdt?: number, customQuotas?: any) => {
    if (!user) {
      router.push(`/login?callbackUrl=/pricing&message=Please log in to upgrade your plan.`);
      return;
    }

    try {
      const res = await fetch("/api/upgrade-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, customPriceBdt, customQuotas }),
      });
      
      if (res.ok) {
        router.push("/contact-to-upgrade");
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-background">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-black">Train like a Grandmaster.</h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Choose a plan that fits your training volume. Start for free, upgrade when you need more analysis power.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Free Tier */}
          <div className="p-8 bg-card border border-border rounded-3xl flex flex-col">
            <h3 className="text-xl font-bold mb-2">Free</h3>
            <div className="flex items-end gap-1 mb-6">
              <span className="text-4xl font-black">0</span>
              <span className="text-slate-500 font-bold mb-1">BDT/mo</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              {["5 Full Game Reviews / month", "10 Training Sessions / month", "Standard Engine Depth", "Basic Statistics"].map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  <Check className="w-5 h-5 text-teal-500 shrink-0" /> {feature}
                </li>
              ))}
            </ul>
            <button
              onClick={() => router.push(user ? "/profile" : "/signup")}
              className="w-full py-4 bg-black/5 dark:bg-slate-800 text-foreground font-black rounded-xl hover:bg-black/10 dark:hover:bg-slate-700 transition"
            >
              {user ? "Current Plan" : "Get Started Free"}
            </button>
          </div>

          {/* Tier 1 - Best Value */}
          <div className="p-8 bg-gradient-to-b from-[#11182c] to-[#0a0f1d] border border-teal-500/50 rounded-3xl flex flex-col relative shadow-2xl shadow-teal-500/10 transform md:-translate-y-4">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-teal-500 text-white px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-1 shadow-lg shadow-teal-500/20">
              <Star className="w-3 h-3 fill-current" /> Best Value
            </div>
            
            <h3 className="text-xl font-bold mb-2 text-white">Pro</h3>
            <div className="flex items-end gap-1 mb-2">
              <span className="text-4xl font-black text-white">100</span>
              <span className="text-slate-400 font-bold mb-1">BDT/mo</span>
            </div>
            <p className="text-teal-400 text-sm font-bold mb-6">7x the value of Free!</p>
            
            <ul className="space-y-4 mb-8 flex-1">
              {["35 Full Game Reviews / month", "70 Training Sessions / month", "Deep Engine Analysis (Stockfish 17)", "Advanced Statistics & Weakness Tracking", "Priority Email Support"].map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-sm font-semibold text-slate-300">
                  <Check className="w-5 h-5 text-teal-400 shrink-0" /> {feature}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleSelectPlan("TIER1")}
              className="w-full py-4 bg-teal-500 text-white font-black rounded-xl hover:bg-teal-600 transition shadow-lg shadow-teal-500/20"
            >
              Upgrade to Pro
            </button>
          </div>

          {/* Tier 2 */}
          <div className="p-8 bg-card border border-border rounded-3xl flex flex-col">
            <h3 className="text-xl font-bold mb-2">Elite</h3>
            <div className="flex items-end gap-1 mb-6">
              <span className="text-4xl font-black">200</span>
              <span className="text-slate-500 font-bold mb-1">BDT/mo</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              {["100 Full Game Reviews / month", "200 Training Sessions / month", "Maximum Engine Depth", "Complete Player Profiling", "24/7 Priority Support"].map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  <Check className="w-5 h-5 text-teal-500 shrink-0" /> {feature}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleSelectPlan("TIER2")}
              className="w-full py-4 bg-black/5 dark:bg-slate-800 text-foreground font-black rounded-xl hover:bg-black/10 dark:hover:bg-slate-700 transition"
            >
              Upgrade to Elite
            </button>
          </div>
        </div>

        {/* Custom Plan Builder */}
        <div className="mt-16 p-8 bg-card border border-border rounded-3xl max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-black mb-2">Build Your Own Plan</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Need a specific amount of reviews and sessions? Customize your quotas below.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="font-bold">Game Reviews / mo</label>
                  <span className="font-black text-teal-500 bg-teal-500/10 px-3 py-1 rounded-lg">{reviews}</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="1000"
                  step="10"
                  value={reviews}
                  onChange={(e) => { setReviews(parseInt(e.target.value)); setIsCalculating(true); setTimeout(() => setIsCalculating(false), 300); }}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="font-bold">Training Sessions / mo</label>
                  <span className="font-black text-teal-500 bg-teal-500/10 px-3 py-1 rounded-lg">{sessions}</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="1000"
                  step="10"
                  value={sessions}
                  onChange={(e) => { setSessions(parseInt(e.target.value)); setIsCalculating(true); setTimeout(() => setIsCalculating(false), 300); }}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
                />
              </div>
            </div>

            <div className="flex flex-col justify-center items-center p-8 bg-black/5 dark:bg-slate-900 border border-border rounded-2xl text-center">
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">Estimated Price</p>
              <div className="flex items-end gap-1 mb-6">
                <span className={`text-5xl font-black transition-opacity ${isCalculating ? "opacity-50" : "opacity-100"}`}>
                  {customPrice}
                </span>
                <span className="text-slate-500 font-bold mb-2">BDT/mo</span>
              </div>
              <p className="text-xs text-slate-500 mb-6 italic">Minimum price: 100 BDT</p>
              
              <button
                onClick={() => handleSelectPlan("CUSTOM", customPrice, { reviews, sessions })}
                className="w-full py-4 bg-teal-500 text-white font-black rounded-xl hover:bg-teal-600 transition shadow-lg shadow-teal-500/20"
              >
                Continue with Custom Plan
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

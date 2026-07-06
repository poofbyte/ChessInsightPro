"use client";

import { useState } from "react";
import { Check, Info, Shield, Zap } from "lucide-react";
import { calculateCustomPrice } from "@core/pricing";

export default function PricingPage() {
  const [reviews, setReviews] = useState(100);
  const [sessions, setSessions] = useState(10);
  
  const customPrice = Math.round(calculateCustomPrice(reviews, sessions));
  
  const generateWhatsAppLink = (plan: string, price: number) => {
    const text = `Hi, I want to subscribe to ChessInsight Pro. \nPlan: ${plan}\nPrice: ৳${price}\nMy account email: `;
    return `https://wa.me/8801700000000?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-background">
      <div className="max-w-5xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-black tracking-tight">Simple, Transparent Pricing</h1>
          <p className="text-slate-600 dark:text-slate-400">Level up your chess with AI analysis. Pay only for what you need.</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Free Tier */}
          <div className="p-8 bg-card border border-border rounded-3xl flex flex-col">
            <h3 className="text-2xl font-bold">Free Plan</h3>
            <div className="mt-4 text-4xl font-black">৳0<span className="text-lg text-slate-500 font-normal">/month</span></div>
            <p className="mt-2 text-slate-600 dark:text-slate-400">Perfect for casual players getting started.</p>
            
            <div className="mt-8 space-y-4 flex-1">
              {[
                "1 Game Review per day",
                "3 Coach Sessions per week",
                "Unlimited Puzzles",
                "Basic Insights"
              ].map(f => (
                <div key={f} className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-teal-500" />
                  <span className="font-medium">{f}</span>
                </div>
              ))}
            </div>
            
            <button className="mt-8 w-full py-4 rounded-xl bg-slate-800 text-white font-bold hover:bg-slate-700 transition" disabled>
              Current Plan
            </button>
          </div>
          
          {/* Pro Tier (Custom) */}
          <div className="p-8 bg-card border-2 border-teal-500 rounded-3xl flex flex-col relative shadow-2xl shadow-teal-500/10">
            <div className="absolute top-0 right-8 -translate-y-1/2 px-4 py-1 bg-teal-500 text-white text-xs font-black uppercase tracking-widest rounded-full">
              Recommended
            </div>
            <h3 className="text-2xl font-bold flex items-center gap-2"><Zap className="w-6 h-6 text-teal-500" /> Pro Plan</h3>
            <div className="mt-4 text-4xl font-black">৳{customPrice}<span className="text-lg text-slate-500 font-normal">/month</span></div>
            <p className="mt-2 text-slate-600 dark:text-slate-400">Customize your quota to fit your training volume.</p>
            
            <div className="mt-8 space-y-6 flex-1">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="font-bold text-sm">Game Reviews / Month</label>
                  <span className="text-teal-600 dark:text-teal-400 font-black">{reviews}</span>
                </div>
                <input 
                  type="range" 
                  min="10" max="500" step="10"
                  value={reviews}
                  onChange={(e) => setReviews(Number(e.target.value))}
                  className="w-full accent-teal-500 h-2 bg-black/10 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              
              <div>
                <div className="flex justify-between mb-2">
                  <label className="font-bold text-sm">Coach Sessions / Month</label>
                  <span className="text-teal-600 dark:text-teal-400 font-black">{sessions}</span>
                </div>
                <input 
                  type="range" 
                  min="5" max="100" step="5"
                  value={sessions}
                  onChange={(e) => setSessions(Number(e.target.value))}
                  className="w-full accent-teal-500 h-2 bg-black/10 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              
              <div className="pt-6 border-t border-border space-y-4">
                {[
                  "Everything in Free",
                  "Priority Engine Access",
                  "Advanced Profile Analytics",
                  "No Ads"
                ].map(f => (
                  <div key={f} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-teal-500" />
                    <span className="font-medium">{f}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <a 
              href={generateWhatsAppLink(`Custom Pro (${reviews} reviews, ${sessions} sessions)`, customPrice)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 w-full py-4 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-black text-center transition block"
            >
              Subscribe via bKash
            </a>
            <p className="text-xs text-center mt-3 text-slate-500 flex items-center justify-center gap-1">
              <Shield className="w-3 h-3" /> Manual verification takes 1-2 hours
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, Star, X } from "lucide-react";
import { calculateCustomPrice } from "@core/pricing";
import { useAuthStore } from "@/app/store";
import ReactMarkdown from "react-markdown";

export default function PricingPage() {
  const router = useRouter();
  const { user, accessToken } = useAuthStore();

  const [pricingConfig, setPricingConfig] = useState<any>(null);
  const [reviews, setReviews] = useState(100);
  const [sessions, setSessions] = useState(50);
  const [isCalculating, setIsCalculating] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState<1 | 2>(1);
  const [selectedPlan, setSelectedPlan] = useState<{ plan: string, price: number, quotas?: any } | null>(null);
  const [paymentConfig, setPaymentConfig] = useState<any>(null);
  const [verificationData, setVerificationData] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/settings/pricing-config")
      .then((res) => res.json())
      .then((data) => setPricingConfig(data))
      .catch(() => {});
  }, []);

  const plans = pricingConfig?.plans || [];
  const pageTitle = pricingConfig?.pageTitle || "Train like a Grandmaster.";
  const pageSubtitle = pricingConfig?.pageSubtitle || "Choose a plan that fits your training volume.";
  const customPlanCfg = pricingConfig?.customPlan || {};

  const customPrice = Math.round(calculateCustomPrice(reviews, sessions));

  const fetchPaymentConfig = async () => {
    try {
      const res = await fetch("/api/settings/payment-config", {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPaymentConfig(data);
      }
    } catch (e) {
      console.error("Failed to fetch payment config:", e);
    }
  };

  const handleSelectPlan = async (plan: string, customPriceBdt?: number, customQuotas?: any) => {
    if (!user) {
      sessionStorage.setItem("loginMessage", "Please log in to upgrade your plan.");
      router.push("/login?callbackUrl=/pricing");
      return;
    }
    const found = plans.find((p: any) => p.id === plan);
    const price = found ? found.price : (customPriceBdt || 0);
    setSelectedPlan({ plan, price, quotas: customQuotas });
    await fetchPaymentConfig();
    setShowModal(true);
    setModalStep(1);
    setIsSuccess(false);
    setVerificationData({});
  };

  const handleVerificationSubmit = async () => {
    if (!selectedPlan) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/upgrade-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          plan: selectedPlan.plan,
          customPriceBdt: selectedPlan.price,
          customQuotas: selectedPlan.quotas,
          verificationDetails: verificationData
        }),
      });
      if (res.ok) {
        setIsSuccess(true);
      } else {
        alert("Failed to submit request.");
      }
    } catch (e) {
      console.error(e);
      alert("An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getParsedFields = () => {
    if (!paymentConfig?.verification_fields) return [];
    try {
      return JSON.parse(paymentConfig.verification_fields);
    } catch {
      return [];
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-background relative">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-black">{pageTitle}</h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            {pageSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan: any) => {
            const isTeal = plan.id === "tier1";
            const cardBg = isTeal
              ? "bg-gradient-to-b from-[#11182c] to-[#0a0f1d] border-teal-500/50 shadow-2xl shadow-teal-500/10"
              : "bg-card border-border";
            const cardOffset = isTeal ? "transform md:-translate-y-4" : "";
            const textColor = isTeal ? "text-white" : "text-foreground";
            const textMuted = isTeal ? "text-slate-300" : "text-slate-700 dark:text-slate-300";
            const textPriceMuted = isTeal ? "text-slate-400" : "text-slate-500";
            const checkColor = isTeal ? "text-teal-400" : "text-teal-500";
            const btnBg = isTeal
              ? "bg-teal-500 text-white hover:bg-teal-600 shadow-lg shadow-teal-500/20"
              : "bg-black/5 dark:bg-slate-800 text-foreground hover:bg-black/10 dark:hover:bg-slate-700";
            const descColor = isTeal ? "text-teal-400" : "text-teal-500";

            return (
              <div
                key={plan.id}
                className={`p-8 ${cardBg} rounded-3xl flex flex-col relative ${cardOffset}`}
              >
                {plan.badge && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-teal-500 text-white px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-1 shadow-lg shadow-teal-500/20">
                    <Star className="w-3 h-3 fill-current" /> {plan.badge}
                  </div>
                )}
                <h3 className={`text-xl font-bold mb-2 ${textColor}`}>{plan.name}</h3>
                <div className="flex items-end gap-1 mb-2">
                  <span className={`text-4xl font-black ${textColor}`}>{plan.price}</span>
                  <span className={`font-bold mb-1 ${textPriceMuted}`}>{plan.currency}/{plan.period}</span>
                </div>
                {plan.description && (
                  <div className={`text-sm font-bold mb-6 ${descColor}`}>
                    <ReactMarkdown>{plan.description}</ReactMarkdown>
                  </div>
                )}
                <ul className="space-y-4 mb-8 flex-1">
                  {plan.features.map((feat: any, i: number) => (
                    <li key={i} className={`flex items-center gap-3 text-sm font-semibold ${textMuted}`}>
                      <Check className={`w-5 h-5 ${checkColor} shrink-0`} /> {feat.text}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => {
                    if (plan.id === "free") {
                      router.push(user ? "/profile" : "/signup");
                    } else {
                      handleSelectPlan(plan.id);
                    }
                  }}
                  className={`w-full py-4 font-black rounded-xl transition ${btnBg}`}
                >
                  {plan.id === "free" && user
                    ? (plan.buttonLabelLoggedIn || "Current Plan")
                    : plan.buttonLabel}
                </button>
              </div>
            );
          })}
        </div>

        {/* Custom Plan Builder */}
        {customPlanCfg.title && (
          <div className="mt-16 p-8 bg-card border border-border rounded-3xl max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-black mb-2">{customPlanCfg.title}</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                <ReactMarkdown>{customPlanCfg.description || ""}</ReactMarkdown>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="font-bold">{customPlanCfg.reviewsLabel || "Game Reviews / mo"}</label>
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
                    <label className="font-bold">{customPlanCfg.sessionsLabel || "Training Sessions / mo"}</label>
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
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">
                  {customPlanCfg.estimatedPriceLabel || "Estimated Price"}
                </p>
                <div className="flex items-end gap-1 mb-6">
                  <span className={`text-5xl font-black transition-opacity ${isCalculating ? "opacity-50" : "opacity-100"}`}>
                    {customPrice}
                  </span>
                  <span className="text-slate-500 font-bold mb-2">BDT/mo</span>
                </div>
                <p className="text-xs text-slate-500 mb-6 italic">Minimum price: {customPlanCfg.minPrice || 100} BDT</p>

                <button
                  onClick={() => handleSelectPlan("CUSTOM", customPrice, { reviews, sessions })}
                  className="w-full py-4 bg-teal-500 text-white font-black rounded-xl hover:bg-teal-600 transition shadow-lg shadow-teal-500/20"
                >
                  {customPlanCfg.buttonLabel || "Continue with Custom Plan"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Upgrade Modal */}
      {showModal && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 bg-black/5 dark:bg-slate-800 rounded-full hover:bg-black/10 dark:hover:bg-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-8">
              {!isSuccess && (
                <>
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-black">
                      Upgrade to {selectedPlan.plan === "TIER1" ? "Pro" : selectedPlan.plan === "TIER2" ? "Elite" : "Custom"}
                    </h2>
                    <span className="px-3 py-1 bg-teal-500/10 text-teal-500 font-black rounded-lg">
                      Step {modalStep} of 2
                    </span>
                  </div>

                  <div className="mb-6 p-4 bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total Due</p>
                      <p className="text-2xl font-black">{selectedPlan.price} BDT</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Account</p>
                      <p className="text-sm font-bold truncate max-w-[150px]" title={user?.email}>{user?.email}</p>
                    </div>
                  </div>
                </>
              )}

              {isSuccess ? (
                <div className="text-center py-12 space-y-6">
                  <div className="w-20 h-20 bg-teal-500/20 rounded-full flex items-center justify-center mx-auto">
                    <Check className="w-10 h-10 text-teal-500" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black mb-2">Request Submitted!</h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      {paymentConfig?.upgrade_success_message || "Your payment verification is under review. You will receive an email once your account is upgraded."}
                    </p>
                  </div>
                  <button
                    onClick={() => { setShowModal(false); router.push("/profile"); }}
                    className="w-full py-4 bg-teal-500 text-white font-black rounded-xl hover:bg-teal-600 transition shadow-lg shadow-teal-500/20"
                  >
                    Go to Profile
                  </button>
                </div>
              ) : modalStep === 1 ? (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="prose prose-slate dark:prose-invert max-w-none text-sm">
                    {paymentConfig ? (
                      <ReactMarkdown>{paymentConfig.payment_instructions || "Payment instructions not set."}</ReactMarkdown>
                    ) : (
                      <p className="animate-pulse">Loading instructions...</p>
                    )}
                  </div>

                  <button
                    onClick={() => setModalStep(2)}
                    disabled={!paymentConfig}
                    className="w-full py-4 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white font-black rounded-xl transition shadow-lg shadow-teal-500/20"
                  >
                    I Have Paid
                  </button>
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    Please provide your payment details so we can verify your transaction.
                  </p>

                  <div className="space-y-4">
                    {getParsedFields().map((field: any) => (
                      <div key={field.id}>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">
                          {field.label} {field.required && <span className="text-rose-500">*</span>}
                        </label>
                        <input
                          type={field.type || "text"}
                          required={field.required}
                          value={verificationData[field.id] || ""}
                          onChange={e => setVerificationData({...verificationData, [field.id]: e.target.value})}
                          className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all shadow-sm"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={() => setModalStep(1)}
                      className="px-6 py-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-foreground font-bold rounded-xl transition"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleVerificationSubmit}
                      disabled={isSubmitting}
                      className="flex-1 py-4 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white font-black rounded-xl transition shadow-lg shadow-teal-500/20"
                    >
                      {isSubmitting ? "Submitting..." : "Submit Verification"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/app/store";
import { useRouter } from "next/navigation";
import { Save, Plus, Trash2 } from "lucide-react";
import RichTextEditor from "@/components/RichTextEditor";

interface PricingConfig {
  pageTitle: string;
  pageSubtitle: string;
  plans: PlanConfig[];
  customPlan: CustomPlanConfig;
}

interface PlanConfig {
  id: string;
  name: string;
  price: number;
  currency: string;
  period: string;
  description: string;
  features: { text: string }[];
  highlight: boolean;
  badge: string;
  buttonLabel: string;
  buttonLabelLoggedIn?: string;
}

interface CustomPlanConfig {
  title: string;
  description: string;
  minPrice: number;
  buttonLabel: string;
  reviewsLabel: string;
  sessionsLabel: string;
  estimatedPriceLabel: string;
}

export default function AdminPricingPage() {
  const { accessToken } = useAuthStore();
  const router = useRouter();
  const [config, setConfig] = useState<PricingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    fetch("/api/admin/pricing-config", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setConfig(data);
        setLoading(false);
      });
  }, [accessToken]);

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/pricing-config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  const updatePlan = (index: number, upd: Partial<PlanConfig>) => {
    if (!config) return;
    const plans = [...config.plans];
    plans[index] = { ...plans[index], ...upd };
    setConfig({ ...config, plans });
  };

  const addFeature = (planIndex: number) => {
    if (!config) return;
    const plans = [...config.plans];
    plans[planIndex] = {
      ...plans[planIndex],
      features: [...plans[planIndex].features, { text: "" }],
    };
    setConfig({ ...config, plans });
  };

  const updateFeature = (planIndex: number, featIndex: number, text: string) => {
    if (!config) return;
    const plans = [...config.plans];
    const features = [...plans[planIndex].features];
    features[featIndex] = { text };
    plans[planIndex] = { ...plans[planIndex], features };
    setConfig({ ...config, plans });
  };

  const removeFeature = (planIndex: number, featIndex: number) => {
    if (!config) return;
    const plans = [...config.plans];
    plans[planIndex] = {
      ...plans[planIndex],
      features: plans[planIndex].features.filter((_, i) => i !== featIndex),
    };
    setConfig({ ...config, plans });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!config) {
    return <div className="p-8 text-slate-500">Failed to load pricing config.</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black">Pricing Configuration</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white font-bold rounded-xl transition"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
        </button>
      </div>

      {/* Page Header */}
      <section className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-bold">Page Header</h2>
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Title</p>
          <input
            value={config.pageTitle}
            onChange={(e) => setConfig({ ...config, pageTitle: e.target.value })}
            className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/50"
          />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Subtitle</p>
          <input
            value={config.pageSubtitle}
            onChange={(e) => setConfig({ ...config, pageSubtitle: e.target.value })}
            className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/50"
          />
        </div>
      </section>

      {/* Plans */}
      {config.plans.map((plan, pIdx) => (
        <section key={plan.id} className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold">
            Plan: {plan.name || "(unnamed)"}
            <span className="ml-auto text-xs text-slate-500 font-mono">{plan.id}</span>
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Plan Name</p>
              <input
                value={plan.name}
                onChange={(e) => updatePlan(pIdx, { name: e.target.value })}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Price</p>
              <input
                type="number"
                value={plan.price}
                onChange={(e) => updatePlan(pIdx, { price: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Currency</p>
              <input
                value={plan.currency}
                onChange={(e) => updatePlan(pIdx, { currency: e.target.value })}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Period</p>
              <input
                value={plan.period}
                onChange={(e) => updatePlan(pIdx, { period: e.target.value })}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              />
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Description (rich text)</p>
            <RichTextEditor
              value={plan.description}
              onChange={(val) => updatePlan(pIdx, { description: val })}
              placeholder="Plan description..."
              className="bg-white dark:bg-slate-900 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Badge Text</p>
              <input
                value={plan.badge}
                onChange={(e) => updatePlan(pIdx, { badge: e.target.value })}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                placeholder="e.g. Best Value"
              />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Highlight Card</p>
              <label className="flex items-center gap-3 mt-2">
                <input
                  type="checkbox"
                  checked={plan.highlight}
                  onChange={(e) => updatePlan(pIdx, { highlight: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-300 text-teal-500 focus:ring-teal-500"
                />
                <span className="text-sm">Show as featured/highlighted plan</span>
              </label>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Button Label</p>
              <input
                value={plan.buttonLabel}
                onChange={(e) => updatePlan(pIdx, { buttonLabel: e.target.value })}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              />
            </div>
            {plan.id === "free" && (
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Button Label (Logged In)</p>
                <input
                  value={plan.buttonLabelLoggedIn || ""}
                  onChange={(e) => updatePlan(pIdx, { buttonLabelLoggedIn: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                />
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Features</p>
              <button
                onClick={() => addFeature(pIdx)}
                className="flex items-center gap-1 text-xs font-bold text-teal-500 hover:text-teal-400 transition"
              >
                <Plus className="w-3 h-3" /> Add Feature
              </button>
            </div>
            <div className="space-y-2">
              {plan.features.map((feat, fIdx) => (
                <div key={fIdx} className="flex items-center gap-2">
                  <input
                    value={feat.text}
                    onChange={(e) => updateFeature(pIdx, fIdx, e.target.value)}
                    className="flex-1 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/50 text-sm"
                    placeholder="Feature description..."
                  />
                  <button
                    onClick={() => removeFeature(pIdx, fIdx)}
                    className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* Custom Plan */}
      <section className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-bold">Custom Plan Builder</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Title</p>
            <input
              value={config.customPlan.title}
              onChange={(e) => setConfig({ ...config, customPlan: { ...config.customPlan, title: e.target.value } })}
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/50"
            />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Min Price</p>
            <input
              type="number"
              value={config.customPlan.minPrice}
              onChange={(e) => setConfig({ ...config, customPlan: { ...config.customPlan, minPrice: parseInt(e.target.value) || 0 } })}
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/50"
            />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Button Label</p>
            <input
              value={config.customPlan.buttonLabel}
              onChange={(e) => setConfig({ ...config, customPlan: { ...config.customPlan, buttonLabel: e.target.value } })}
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/50"
            />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Reviews Label</p>
            <input
              value={config.customPlan.reviewsLabel}
              onChange={(e) => setConfig({ ...config, customPlan: { ...config.customPlan, reviewsLabel: e.target.value } })}
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/50"
            />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Sessions Label</p>
            <input
              value={config.customPlan.sessionsLabel}
              onChange={(e) => setConfig({ ...config, customPlan: { ...config.customPlan, sessionsLabel: e.target.value } })}
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/50"
            />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Est. Price Label</p>
            <input
              value={config.customPlan.estimatedPriceLabel}
              onChange={(e) => setConfig({ ...config, customPlan: { ...config.customPlan, estimatedPriceLabel: e.target.value } })}
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/50"
            />
          </div>
        </div>
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Description (rich text)</p>
          <RichTextEditor
            value={config.customPlan.description}
            onChange={(val) => setConfig({ ...config, customPlan: { ...config.customPlan, description: val } })}
            placeholder="Custom plan section description..."
            className="bg-white dark:bg-slate-900 rounded-xl"
          />
        </div>
      </section>

      <div className="flex justify-end pb-8">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-8 py-3 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white font-bold rounded-xl transition shadow-lg shadow-teal-500/20"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

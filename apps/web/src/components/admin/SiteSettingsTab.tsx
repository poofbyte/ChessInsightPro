"use client";

import { useState, useEffect } from "react";
import { SiteSettings } from "@core/content";
import { useAuthStore } from "@/app/store";
import { Save, Plus } from "lucide-react";

export function SiteSettingsTab({ config, updateConfig }: { config: SiteSettings, updateConfig: (val: Partial<SiteSettings>) => void }) {
  if (!config) return null;

  return (
    <div className="space-y-8">
      {/* General Settings */}
      <section className="bg-card border border-border rounded-2xl p-6 space-y-6">
        <h2 className="text-xl font-bold">General Settings</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Site Name</p>
            <input
              value={config.siteName || ""}
              onChange={(e) => updateConfig({ siteName: e.target.value })}
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              placeholder="ChessInsight Pro"
            />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Primary Color (Hex)</p>
            <input
              value={config.primaryColor || ""}
              onChange={(e) => updateConfig({ primaryColor: e.target.value })}
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              placeholder="#14b8a6"
            />
          </div>
        </div>
      </section>

      {/* SEO Configuration */}
      <section className="bg-card border border-border rounded-2xl p-6 space-y-6">
        <h2 className="text-xl font-bold">Search Engine Optimization (SEO)</h2>
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">SEO Title (Overrides Site Name)</p>
          <input
            value={config.seoTitle || ""}
            onChange={(e) => updateConfig({ seoTitle: e.target.value })}
            className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/50"
            placeholder="ChessInsight Pro - Advanced Agentic Training"
          />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Meta Description</p>
          <textarea
            value={config.description || ""}
            onChange={(e) => updateConfig({ description: e.target.value })}
            className="w-full h-24 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/50"
            placeholder="Global description for SEO..."
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">SEO Keywords (Comma Separated)</p>
            <input
              value={config.seoKeywords || ""}
              onChange={(e) => updateConfig({ seoKeywords: e.target.value })}
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              placeholder="chess, AI, training, tactics"
            />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Open Graph (OG) Image URL</p>
            <input
              value={config.ogImage || ""}
              onChange={(e) => updateConfig({ ogImage: e.target.value })}
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              placeholder="https://example.com/og-image.jpg"
            />
          </div>
        </div>
      </section>

      {/* Organization & Management */}
      <section className="bg-card border border-border rounded-2xl p-6 space-y-6">
        <h2 className="text-xl font-bold">Management & Organization</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Company Name</p>
            <input
              value={config.companyName || ""}
              onChange={(e) => updateConfig({ companyName: e.target.value })}
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              placeholder="InsightTech Ltd."
            />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Support Email</p>
            <input
              type="email"
              value={config.supportEmail || ""}
              onChange={(e) => updateConfig({ supportEmail: e.target.value })}
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              placeholder="support@chessinsight.com"
            />
          </div>
        </div>
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Company Address</p>
          <input
            value={config.companyAddress || ""}
            onChange={(e) => updateConfig({ companyAddress: e.target.value })}
            className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/50"
            placeholder="123 Tech Lane, NY 10001"
          />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Analytics ID (e.g. Google Analytics / Plausible)</p>
          <input
            value={config.analyticsId || ""}
            onChange={(e) => updateConfig({ analyticsId: e.target.value })}
            className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/50"
            placeholder="G-XXXXXXXXXX"
          />
        </div>
      </section>

      {/* Operational Config */}
      <section className="bg-card border border-border rounded-2xl p-6">
        <h3 className="text-lg font-bold mb-4 text-rose-500">Danger Zone (Operational Config)</h3>
        <label className="flex items-center gap-3 p-4 border border-rose-500/20 bg-rose-500/5 rounded-xl">
          <input
            type="checkbox"
            checked={config.maintenanceMode || false}
            onChange={(e) => updateConfig({ maintenanceMode: e.target.checked })}
            className="w-5 h-5 rounded border-rose-300 text-rose-500 focus:ring-rose-500"
          />
          <div>
            <span className="text-sm font-bold block">Enable Maintenance Mode</span>
            <span className="text-xs text-slate-500">Blocks public access to the application immediately. Users will see a maintenance page.</span>
          </div>
        </label>
      </section>

      {/* Raw System Configuration Store */}
      <SystemConfigSection />
    </div>
  );
}

function SystemConfigSection() {
  const { accessToken } = useAuthStore();
  const [config, setConfig] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");

  const fetchConfig = () => {
    if (!accessToken) return;
    fetch("/api/admin/config", {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
      .then(res => res.json())
      .then(data => {
        setConfig(data.config || {});
        setLoading(false);
      });
  };

  useEffect(() => { fetchConfig(); }, [accessToken]);

  const handleSave = async (key: string, value: any) => {
    try {
      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ key, value })
      });
      
      if (res.ok) {
        fetchConfig();
        if (key === newKey) {
          setNewKey("");
          setNewValue("");
        }
      } else {
        alert("Failed to save config");
      }
    } catch (e) {
      console.error(e);
      alert("Error saving config");
    }
  };

  return (
    <section className="mt-12 space-y-8">
      <div className="border-t border-border pt-8">
        <h2 className="text-2xl font-black text-rose-500 mb-2">Raw System Configuration</h2>
        <p className="text-slate-500 mb-6">Advanced key-value store for system overrides. Be careful editing these manually.</p>
      </div>

      <div className="bg-card border border-border rounded-3xl p-8 space-y-6">
        {loading ? (
          <p className="text-slate-500">Loading configuration...</p>
        ) : (
          <div className="space-y-6">
            {Object.keys(config).length === 0 ? (
              <p className="text-slate-500 italic">No configurations found. Add one below.</p>
            ) : (
              Object.entries(config).map(([key, value]) => (
              <div key={key} className="flex items-start gap-4 p-4 bg-black/5 dark:bg-slate-900 rounded-2xl border border-border">
                <div className="flex-1 space-y-2">
                  <label className="font-bold font-mono text-teal-500">{key}</label>
                  <textarea
                    defaultValue={typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                    onBlur={(e) => {
                      const val = e.target.value;
                      try {
                        const parsed = (val.startsWith('{') || val.startsWith('[')) ? JSON.parse(val) : val;
                        if (JSON.stringify(parsed) !== JSON.stringify(value) && val !== value) {
                          handleSave(key, parsed);
                        }
                      } catch {
                        if (val !== value) handleSave(key, val);
                      }
                    }}
                    className="w-full bg-background border border-border rounded-xl p-3 text-sm font-mono outline-none focus:border-teal-500 transition-colors min-h-[100px]"
                  />
                </div>
                <button
                  className="mt-8 p-3 bg-teal-500/10 text-teal-500 hover:bg-teal-500/20 rounded-xl transition shrink-0"
                  title="Changes auto-save on blur, click to force save"
                >
                  <Save className="w-5 h-5" />
                </button>
              </div>
            )))}
          </div>
        )}
      </div>

      <div className="bg-card border border-border rounded-3xl p-8 space-y-6">
        <h2 className="text-xl font-bold">Add New Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="KEY_NAME"
            value={newKey}
            onChange={e => setNewKey(e.target.value)}
            className="bg-background border border-border rounded-xl p-3 text-sm font-mono outline-none focus:border-teal-500"
          />
          <input
            type="text"
            placeholder="Value (JSON or string)"
            value={newValue}
            onChange={e => setNewValue(e.target.value)}
            className="md:col-span-2 bg-background border border-border rounded-xl p-3 text-sm font-mono outline-none focus:border-teal-500"
          />
        </div>
        <button
          onClick={() => {
            if (!newKey) return;
            try {
              const val = (newValue.startsWith('{') || newValue.startsWith('[')) ? JSON.parse(newValue) : newValue;
              handleSave(newKey, val);
            } catch {
              handleSave(newKey, newValue);
            }
          }}
          disabled={!newKey}
          className="flex items-center gap-2 px-6 py-3 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white font-bold rounded-xl transition shadow-lg shadow-teal-500/20"
        >
          <Plus className="w-5 h-5" /> Add Config
        </button>
      </div>
    </section>
  );
}

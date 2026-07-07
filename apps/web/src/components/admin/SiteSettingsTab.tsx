"use client";

import { SiteSettings } from "@core/content";

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
    </div>
  );
}

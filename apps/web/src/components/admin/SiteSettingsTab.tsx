"use client";

import { SiteSettings } from "@core/content";

export function SiteSettingsTab({ config, updateConfig }: { config: SiteSettings, updateConfig: (val: Partial<SiteSettings>) => void }) {
  if (!config) return null;

  return (
    <div className="space-y-6 bg-card border border-border rounded-2xl p-6">
      <h2 className="text-xl font-bold">Global Site Settings</h2>
      
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

      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Meta Description</p>
        <textarea
          value={config.description || ""}
          onChange={(e) => updateConfig({ description: e.target.value })}
          className="w-full h-24 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/50"
          placeholder="Global description for SEO..."
        />
      </div>

      <div className="border-t border-border pt-6 mt-6">
        <h3 className="text-lg font-bold mb-4">Operational Config</h3>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={config.maintenanceMode || false}
            onChange={(e) => updateConfig({ maintenanceMode: e.target.checked })}
            className="w-5 h-5 rounded border-slate-300 text-teal-500 focus:ring-teal-500"
          />
          <span className="text-sm">Enable Maintenance Mode (Blocks public access)</span>
        </label>
      </div>
    </div>
  );
}

"use client";

export interface SettingsContent {
  subtitle: string;
  engineDesc: string;
  legalDesc: string;
  aboutDesc: string;
  contactDesc: string;
}

export function SettingsTab({ config, updateConfig }: { config: SettingsContent, updateConfig: (val: Partial<SettingsContent>) => void }) {
  if (!config) return null;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold">Frontend Settings Page Content</h2>

      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Page Subtitle</p>
        <input
          value={config.subtitle || ""}
          onChange={(e) => updateConfig({ subtitle: e.target.value })}
          className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/50"
          placeholder="Configure engine, board appearance, and coach preferences."
        />
      </div>

      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Engine Section Description</p>
        <textarea
          value={config.engineDesc || ""}
          onChange={(e) => updateConfig({ engineDesc: e.target.value })}
          className="w-full h-24 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/50"
          placeholder="Choose which Stockfish engine version to use..."
        />
      </div>

      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Contact Section Description</p>
        <textarea
          value={config.contactDesc || ""}
          onChange={(e) => updateConfig({ contactDesc: e.target.value })}
          className="w-full h-24 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/50"
          placeholder="Have a question, bug report, or feature request? Send us a message."
        />
      </div>

      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Legal Section Description</p>
        <textarea
          value={config.legalDesc || ""}
          onChange={(e) => updateConfig({ legalDesc: e.target.value })}
          className="w-full h-24 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/50"
        />
      </div>

      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">About Section Description</p>
        <textarea
          value={config.aboutDesc || ""}
          onChange={(e) => updateConfig({ aboutDesc: e.target.value })}
          className="w-full h-24 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/50"
          placeholder="ChessInsight Pro is an all-in-one chess improvement platform..."
        />
      </div>
    </div>
  );
}

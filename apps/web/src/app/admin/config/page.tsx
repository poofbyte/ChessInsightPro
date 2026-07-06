"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/app/store";
import { Save, Plus } from "lucide-react";

export default function AdminConfigPage() {
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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black">System Configuration</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">Manage global settings, pricing configs, and engine limits.</p>
      </div>

      <div className="bg-card border border-border rounded-3xl p-8 space-y-6">
        {loading ? (
          <p className="text-slate-500">Loading configuration...</p>
        ) : (
          <div className="space-y-6">
            {Object.entries(config).map(([key, value]) => (
              <div key={key} className="flex items-start gap-4 p-4 bg-black/5 dark:bg-slate-900 rounded-2xl border border-border">
                <div className="flex-1 space-y-2">
                  <label className="font-bold font-mono text-teal-500">{key}</label>
                  <textarea
                    defaultValue={typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                    onBlur={(e) => {
                      const val = e.target.value;
                      try {
                        // try to parse as JSON if it looks like it
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
            ))}
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
    </div>
  );
}

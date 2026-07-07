"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuthStore } from "@/app/store";
import dynamic from "next/dynamic";
import { Save, X, ShieldAlert, Plus, Trash2, GripVertical } from "lucide-react";
import { PricingTab } from "@/components/admin/PricingTab";
import { SettingsTab } from "@/components/admin/SettingsTab";
import { SiteSettingsTab } from "@/components/admin/SiteSettingsTab";

const RichTextEditor = dynamic(() => import("@/components/RichTextEditor"), { ssr: false });

interface Section {
  id: string;
  title: string;
  content: string;
}

interface GlossaryTerm {
  term: string;
  definition: string;
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  slides: { title: string; content: string }[];
}

interface PageContent {
  lessons?: { title: string; description: string; lessons: Lesson[] };
  rules?: { title: string; sections: Section[] };
  terms?: { title: string; terms: GlossaryTerm[] };
  openings?: { title: string; description: string; content: string };
  home?: { title: string; subtitle: string; heroText: string };
  pricing_config?: any;
  settings_content?: any;
  site_settings?: any;
  [key: string]: any;
}

const DEFAULT_CONTENT: PageContent = {
  lessons: { title: "Chess Lessons", description: "", lessons: [] },
  rules: { title: "Rules of Chess", sections: [] },
  terms: { title: "Chess Glossary", terms: [] },
  openings: { title: "Chess Openings", description: "", content: "" },
  home: { title: "", subtitle: "", heroText: "" },
  pricing_config: { pageTitle: "", pageSubtitle: "", plans: [], customPlan: { title: "", description: "", minPrice: 0, buttonLabel: "", reviewsLabel: "", sessionsLabel: "", estimatedPriceLabel: "" } },
  settings_content: { subtitle: "", engineDesc: "", legalDesc: "", aboutDesc: "" },
  site_settings: { siteName: "ChessInsight Pro", description: "", maintenanceMode: false },
};

export default function AdminContentPage() {
  const { accessToken } = useAuthStore();
  const [content, setContent] = useState<PageContent>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<string>("lessons");

  const fetchContent = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/content", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (res.ok) setContent({ ...DEFAULT_CONTENT, ...data });
      else setError(data.error || "Failed to load");
    } catch { setError("Failed to load content"); }
    setLoading(false);
  }, [accessToken]);

  useEffect(() => { fetchContent(); }, [fetchContent]);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(content),
      });
      if (res.ok) setSaved(true);
      else { const d = await res.json(); setError(d.error || "Save failed"); }
    } catch { setError("Save failed"); }
    setSaving(false);
  };

  const updateSection = (section: string, value: any) => {
    setContent((prev) => ({ ...prev, [section]: value }));
  };

  const tabs = [
    { id: "lessons", label: "Lessons" },
    { id: "rules", label: "Rules" },
    { id: "terms", label: "Glossary" },
    { id: "openings", label: "Openings" },
    { id: "home", label: "Home Page" },
    { id: "pricing", label: "Pricing" },
    { id: "settings", label: "Settings" },
    { id: "site_settings", label: "Site Settings" },
  ];

  if (loading) return <div className="p-8 text-slate-500">Loading content editor...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black">Content Management</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white font-bold rounded-xl transition flex items-center gap-2"
        >
          <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save All Changes"}
        </button>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold rounded-xl flex items-center gap-2">
          <ShieldAlert className="w-4 h-4" /> <span>{error}</span>
          <button onClick={() => setError("")} className="ml-auto"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}
      {saved && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-xl flex items-center gap-2">
          <span>Content saved successfully.</span>
          <button onClick={() => setSaved(false)} className="ml-auto"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      <div className="flex gap-4 border-b border-border pb-px">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-3 font-bold text-sm border-b-2 transition-colors ${
              activeTab === t.id ? "border-teal-500 text-teal-400" : "border-transparent text-slate-500 hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-2xl p-6">
        {/* LESSONS TAB */}
        {activeTab === "lessons" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Page Title</p>
                <input
                  type="text" value={content.lessons?.title || ""}
                  onChange={(e) => updateSection("lessons", { ...content.lessons, title: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
                />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Description</p>
                <input
                  type="text" value={content.lessons?.description || ""}
                  onChange={(e) => updateSection("lessons", { ...content.lessons, description: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Lessons</p>
                <button
                  onClick={() => updateSection("lessons", {
                    ...content.lessons,
                    lessons: [...(content.lessons?.lessons || []), { id: `lesson-${Date.now()}`, title: "New Lesson", description: "", slides: [] }],
                  })}
                  className="px-3 py-1.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-500 text-xs font-bold rounded-lg flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add Lesson
                </button>
              </div>
              {(content.lessons?.lessons || []).map((lesson, li) => (
                <div key={lesson.id} className="bg-black/5 dark:bg-slate-900 border border-border rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <input
                      type="text" value={lesson.title}
                      onChange={(e) => {
                        const lessons = [...(content.lessons?.lessons || [])];
                        lessons[li] = { ...lessons[li], title: e.target.value };
                        updateSection("lessons", { ...content.lessons, lessons });
                      }}
                      className="flex-1 px-3 py-1.5 bg-background border border-border rounded-lg text-sm font-bold mr-2"
                      placeholder="Lesson title"
                    />
                    <button
                      onClick={() => {
                        const lessons = (content.lessons?.lessons || []).filter((_, i) => i !== li);
                        updateSection("lessons", { ...content.lessons, lessons });
                      }}
                      className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <textarea
                    value={lesson.description}
                    onChange={(e) => {
                      const lessons = [...(content.lessons?.lessons || [])];
                      lessons[li] = { ...lessons[li], description: e.target.value };
                      updateSection("lessons", { ...content.lessons, lessons });
                    }}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs"
                    rows={2}
                    placeholder="Lesson description"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RULES TAB */}
        {activeTab === "rules" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Content Sections</p>
              <button
                onClick={() => updateSection("rules", {
                  ...content.rules,
                  sections: [...(content.rules?.sections || []), { id: `sec-${Date.now()}`, title: "New Section", content: "" }],
                })}
                className="px-3 py-1.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-500 text-xs font-bold rounded-lg flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Section
              </button>
            </div>
            {(content.rules?.sections || []).map((sec, si) => (
              <div key={sec.id} className="bg-black/5 dark:bg-slate-900 border border-border rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <input
                    type="text" value={sec.title}
                    onChange={(e) => {
                      const sections = [...(content.rules?.sections || [])];
                      sections[si] = { ...sections[si], title: e.target.value };
                      updateSection("rules", { ...content.rules, sections });
                    }}
                    className="flex-1 px-3 py-1.5 bg-background border border-border rounded-lg text-sm font-bold mr-2"
                    placeholder="Section title"
                  />
                  <button
                    onClick={() => {
                      const sections = (content.rules?.sections || []).filter((_, i) => i !== si);
                      updateSection("rules", { ...content.rules, sections });
                    }}
                    className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-lg"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <RichTextEditor
                  value={sec.content}
                  onChange={(html) => {
                    const sections = [...(content.rules?.sections || [])];
                    sections[si] = { ...sections[si], content: html };
                    updateSection("rules", { ...content.rules, sections });
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {/* TERMS TAB */}
        {activeTab === "terms" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Glossary Terms</p>
              <button
                onClick={() => updateSection("terms", {
                  ...content.terms,
                  terms: [...(content.terms?.terms || []), { term: "", definition: "" }],
                })}
                className="px-3 py-1.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-500 text-xs font-bold rounded-lg flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Term
              </button>
            </div>
            {(content.terms?.terms || []).map((term, ti) => (
              <div key={ti} className="bg-black/5 dark:bg-slate-900 border border-border rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <input
                    type="text" value={term.term}
                    onChange={(e) => {
                      const terms = [...(content.terms?.terms || [])];
                      terms[ti] = { ...terms[ti], term: e.target.value };
                      updateSection("terms", { ...content.terms, terms });
                    }}
                    className="flex-1 px-3 py-1.5 bg-background border border-border rounded-lg text-sm font-bold mr-2"
                    placeholder="Term name"
                  />
                  <button
                    onClick={() => {
                      const terms = (content.terms?.terms || []).filter((_, i) => i !== ti);
                      updateSection("terms", { ...content.terms, terms });
                    }}
                    className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-lg"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <textarea
                  value={term.definition}
                  onChange={(e) => {
                    const terms = [...(content.terms?.terms || [])];
                    terms[ti] = { ...terms[ti], definition: e.target.value };
                    updateSection("terms", { ...content.terms, terms });
                  }}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs"
                  rows={3}
                  placeholder="Definition"
                />
              </div>
            ))}
          </div>
        )}

        {/* OPENINGS TAB */}
        {activeTab === "openings" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Page Title</p>
                <input
                  type="text" value={content.openings?.title || ""}
                  onChange={(e) => updateSection("openings", { ...content.openings, title: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
                />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Description</p>
                <input
                  type="text" value={content.openings?.description || ""}
                  onChange={(e) => updateSection("openings", { ...content.openings, description: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
                />
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Content</p>
              <RichTextEditor
                value={content.openings?.content || ""}
                onChange={(html) => updateSection("openings", { ...content.openings, content: html })}
              />
            </div>
          </div>
        )}

        {/* HOME TAB */}
        {activeTab === "home" && (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Hero Title</p>
              <input
                type="text" value={content.home?.title || ""}
                onChange={(e) => updateSection("home", { ...content.home, title: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
              />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Hero Subtitle</p>
              <input
                type="text" value={content.home?.subtitle || ""}
                onChange={(e) => updateSection("home", { ...content.home, subtitle: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
              />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Hero Text (Rich)</p>
              <RichTextEditor
                value={content.home?.heroText || ""}
                onChange={(html) => updateSection("home", { ...content.home, heroText: html })}
              />
            </div>
          </div>
        )}

        {activeTab === "pricing" && (
          <PricingTab 
            config={content.pricing_config} 
            updateConfig={(upd) => updateSection("pricing_config", { ...content.pricing_config, ...upd })} 
          />
        )}

        {activeTab === "settings" && (
          <SettingsTab 
            config={content.settings_content} 
            updateConfig={(upd) => updateSection("settings_content", { ...content.settings_content, ...upd })} 
          />
        )}

        {activeTab === "site_settings" && (
          <SiteSettingsTab 
            config={content.site_settings} 
            updateConfig={(upd) => updateSection("site_settings", { ...content.site_settings, ...upd })} 
          />
        )}
      </div>
    </div>
  );
}

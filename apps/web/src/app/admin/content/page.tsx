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
  lessons?: any[];
  rules?: any[];
  terms?: any[];
  openings?: { title: string; description: string; content: string };
  home?: { title: string; subtitle: string; heroText: string };
  pricing_config?: any;
  settings_content?: any;
  site_settings?: any;
  [key: string]: any;
}

const DEFAULT_CONTENT: PageContent = {
  lessons: [],
  rules: [],
  terms: [],
  openings: { title: "Chess Openings", description: "", content: "" },
  home: { title: "", subtitle: "", heroText: "" },
  pricing_config: { pageTitle: "", pageSubtitle: "", plans: [], customPlan: { title: "", description: "", minPrice: 0, buttonLabel: "", reviewsLabel: "", sessionsLabel: "", estimatedPriceLabel: "" } },
  settings_content: { subtitle: "", engineDesc: "", legalDesc: "", contactDesc: "", aboutDesc: "" },
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
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Lessons</p>
              <button
                onClick={() => updateSection("lessons", [
                  ...(content.lessons || []),
                  { id: `lesson-${Date.now()}`, title: "New Lesson", category: "Basics", duration: "5 min", icon: "♟", slides: [] },
                ])}
                className="px-3 py-1.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-500 text-xs font-bold rounded-lg flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Lesson
              </button>
            </div>
            {(content.lessons || []).map((lesson: any, li: number) => (
              <div key={lesson.id} className="bg-black/5 dark:bg-slate-900 border border-border rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1 grid grid-cols-4 gap-2 mr-4">
                    <input type="text" value={lesson.title} onChange={(e) => {
                      const lessons = [...(content.lessons || [])];
                      lessons[li] = { ...lessons[li], title: e.target.value };
                      updateSection("lessons", lessons);
                    }} className="px-3 py-1.5 bg-background border border-border rounded-lg text-sm font-bold col-span-2" placeholder="Lesson title" />
                    
                    <input type="text" value={lesson.category} onChange={(e) => {
                      const lessons = [...(content.lessons || [])];
                      lessons[li] = { ...lessons[li], category: e.target.value };
                      updateSection("lessons", lessons);
                    }} className="px-3 py-1.5 bg-background border border-border rounded-lg text-sm" placeholder="Category" />
                    
                    <input type="text" value={lesson.icon} onChange={(e) => {
                      const lessons = [...(content.lessons || [])];
                      lessons[li] = { ...lessons[li], icon: e.target.value };
                      updateSection("lessons", lessons);
                    }} className="px-3 py-1.5 bg-background border border-border rounded-lg text-sm" placeholder="Icon" />
                  </div>
                  <button
                    onClick={() => {
                      const lessons = (content.lessons || []).filter((_: any, i: number) => i !== li);
                      updateSection("lessons", lessons);
                    }}
                    className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-lg"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-2 pt-2 border-t border-border/50">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Slides</p>
                  {(lesson.slides || []).map((slide: any, si: number) => (
                    <div key={si} className="flex flex-col gap-2 p-2 bg-background/50 border border-border rounded-lg">
                      <div className="flex gap-2">
                        <input type="text" value={slide.title} onChange={(e) => {
                          const lessons = [...(content.lessons || [])];
                          lessons[li].slides[si].title = e.target.value;
                          updateSection("lessons", lessons);
                        }} className="flex-1 px-3 py-1 bg-background border border-border rounded text-xs" placeholder="Slide Title" />
                        <input type="text" value={slide.fen} onChange={(e) => {
                          const lessons = [...(content.lessons || [])];
                          lessons[li].slides[si].fen = e.target.value;
                          updateSection("lessons", lessons);
                        }} className="flex-1 px-3 py-1 bg-background border border-border rounded text-xs font-mono" placeholder="FEN string" />
                        <button onClick={() => {
                          const lessons = [...(content.lessons || [])];
                          lessons[li].slides = lessons[li].slides.filter((_: any, i: number) => i !== si);
                          updateSection("lessons", lessons);
                        }} className="p-1 text-rose-500"><Trash2 className="w-3 h-3" /></button>
                      </div>
                      <textarea value={slide.body} onChange={(e) => {
                        const lessons = [...(content.lessons || [])];
                        lessons[li].slides[si].body = e.target.value;
                        updateSection("lessons", lessons);
                      }} className="w-full px-3 py-1 bg-background border border-border rounded text-xs" rows={2} placeholder="Slide content" />
                    </div>
                  ))}
                  <button onClick={() => {
                    const lessons = [...(content.lessons || [])];
                    lessons[li].slides = [...(lessons[li].slides || []), { title: "New Slide", body: "", fen: "" }];
                    updateSection("lessons", lessons);
                  }} className="text-xs text-teal-500 font-bold hover:underline">+ Add Slide</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* RULES TAB */}
        {activeTab === "rules" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Rules</p>
              <button
                onClick={() => updateSection("rules", [
                  ...(content.rules || []),
                  { id: `rule-${Date.now()}`, title: "New Rule", icon: "♟", content: "", fen: "", tip: "" },
                ])}
                className="px-3 py-1.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-500 text-xs font-bold rounded-lg flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Rule
              </button>
            </div>
            {(content.rules || []).map((sec: any, si: number) => (
              <div key={sec.id} className="bg-black/5 dark:bg-slate-900 border border-border rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1 grid grid-cols-3 gap-2 mr-4">
                    <input type="text" value={sec.title} onChange={(e) => {
                      const rules = [...(content.rules || [])];
                      rules[si] = { ...rules[si], title: e.target.value };
                      updateSection("rules", rules);
                    }} className="px-3 py-1.5 bg-background border border-border rounded-lg text-sm font-bold" placeholder="Rule Title" />
                    <input type="text" value={sec.icon} onChange={(e) => {
                      const rules = [...(content.rules || [])];
                      rules[si] = { ...rules[si], icon: e.target.value };
                      updateSection("rules", rules);
                    }} className="px-3 py-1.5 bg-background border border-border rounded-lg text-sm" placeholder="Icon" />
                    <input type="text" value={sec.fen} onChange={(e) => {
                      const rules = [...(content.rules || [])];
                      rules[si] = { ...rules[si], fen: e.target.value };
                      updateSection("rules", rules);
                    }} className="px-3 py-1.5 bg-background border border-border rounded-lg text-sm font-mono" placeholder="FEN string" />
                  </div>
                  <button onClick={() => {
                    const rules = (content.rules || []).filter((_: any, i: number) => i !== si);
                    updateSection("rules", rules);
                  }} className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-lg">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <textarea value={sec.content} onChange={(e) => {
                  const rules = [...(content.rules || [])];
                  rules[si] = { ...rules[si], content: e.target.value };
                  updateSection("rules", rules);
                }} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs" rows={3} placeholder="Content (Plain text or newlines)" />
                <input type="text" value={sec.tip} onChange={(e) => {
                  const rules = [...(content.rules || [])];
                  rules[si] = { ...rules[si], tip: e.target.value };
                  updateSection("rules", rules);
                }} className="w-full px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg text-xs" placeholder="Pro Tip..." />
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
                onClick={() => updateSection("terms", [
                  ...(content.terms || []),
                  { term: "New Term", category: "General", definition: "" },
                ])}
                className="px-3 py-1.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-500 text-xs font-bold rounded-lg flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Term
              </button>
            </div>
            {(content.terms || []).map((term: any, ti: number) => (
              <div key={ti} className="bg-black/5 dark:bg-slate-900 border border-border rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1 grid grid-cols-2 gap-2 mr-4">
                    <input type="text" value={term.term} onChange={(e) => {
                      const terms = [...(content.terms || [])];
                      terms[ti] = { ...terms[ti], term: e.target.value };
                      updateSection("terms", terms);
                    }} className="px-3 py-1.5 bg-background border border-border rounded-lg text-sm font-bold" placeholder="Term name" />
                    <input type="text" value={term.category} onChange={(e) => {
                      const terms = [...(content.terms || [])];
                      terms[ti] = { ...terms[ti], category: e.target.value };
                      updateSection("terms", terms);
                    }} className="px-3 py-1.5 bg-background border border-border rounded-lg text-sm" placeholder="Category" />
                  </div>
                  <button onClick={() => {
                    const terms = (content.terms || []).filter((_: any, i: number) => i !== ti);
                    updateSection("terms", terms);
                  }} className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-lg">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <textarea value={term.definition} onChange={(e) => {
                  const terms = [...(content.terms || [])];
                  terms[ti] = { ...terms[ti], definition: e.target.value };
                  updateSection("terms", terms);
                }} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs" rows={2} placeholder="Definition" />
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

"use client";

import { useState, useEffect } from "react";
import { logActivity } from "@/lib/activity-log";
import { AlignLeft, Search } from "lucide-react";
import { Term } from "@core/content";
import { useAuthStore } from "@/app/store";
import SignUpPrompt from "@/components/SignUpPrompt";

export function ClientTerms({ terms }: { terms: Term[] }) {
  const { accessToken } = useAuthStore();
  const [showSignUp, setShowSignUp] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { logActivity("page_view", "Learn - Terms"); }, []);
  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
    if (useAuthStore.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);
  useEffect(() => { if (hydrated && !accessToken) setShowSignUp(true); }, [hydrated, accessToken]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const CATEGORIES = ["All", ...Array.from(new Set(terms.map((t) => t.category)))];

  const filtered = terms.filter((t) => {
    const matchSearch = t.term.toLowerCase().includes(search.toLowerCase()) || t.definition.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All" || t.category === category;
    return matchSearch && matchCat;
  });

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-background">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-2xl bg-violet-500/15 border border-violet-500/20">
            <AlignLeft className="w-6 h-6 text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black">Chess Glossary</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Understand the language of chess. Search for any term.</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex items-center flex-1 gap-2 px-4 py-2.5 bg-card border border-border rounded-2xl focus-within:border-violet-500 transition-colors">
            <Search className="w-5 h-5 shrink-0 text-slate-400" />
            <input
              type="text"
              placeholder="Search terms..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-slate-400"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat as string)}
                className={`px-4 py-3 rounded-2xl text-sm font-bold whitespace-nowrap transition ${
                  category === cat ? "bg-violet-500 text-white" : "bg-card border border-border text-slate-500 hover:text-foreground"
                }`}
              >
                {cat as string}
              </button>
            ))}
          </div>
        </div>

        {/* Dictionary */}
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="p-8 text-center bg-card border border-border rounded-2xl text-slate-500">
              No terms found matching your criteria.
            </div>
          ) : (
            filtered.map((t, i) => (
              <div key={i} className="p-6 bg-card border border-border rounded-2xl hover:border-violet-500/30 transition">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-bold text-violet-400">{t.term}</h3>
                  <span className="px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs font-bold text-violet-300 uppercase tracking-widest">
                    {t.category}
                  </span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm">{t.definition}</p>
              </div>
            ))
          )}
        </div>
      </div>
      <SignUpPrompt open={showSignUp} onClose={() => setShowSignUp(false)} feature="chess glossary" />
    </div>
  );
}

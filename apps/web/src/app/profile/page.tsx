"use client";

import { useEffect, useState } from "react";
import { PlayerProfile } from "@chessinsight/types";
import { db } from "../db";
import { RecommendationEngine } from "@chessinsight/recommendations";
import { SpacedRepetitionManager } from "@chessinsight/learning";
import { AlertTriangle, Award, BookOpen, Target, TrendingUp, User, LogOut, Settings } from "lucide-react";
import { useAuthStore } from "@/app/store";
import SignUpPrompt from "@/components/SignUpPrompt";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout/PageContainer";
import { ContentContainer } from "@/components/layout/ContentContainer";

export default function ProfilePage() {
  const router = useRouter();
  const { user, clearAuth, accessToken } = useAuthStore();
  const [showSignUp, setShowSignUp] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
    if (useAuthStore.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);
  useEffect(() => { if (hydrated && !accessToken) setShowSignUp(true); }, [hydrated, accessToken]);
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [leitnerCards, setLeitnerCards] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"analytics" | "account">("analytics");
  
  const [formData, setFormData] = useState({
    name: "", phone: "", chess_com_url: "", lichess_url: "", fide_id_url: "", fide_elo: "", bio: ""
  });
  const [initialPhone, setInitialPhone] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const load = async () => {
    const [prof, cards] = await Promise.all([
      db.profiles.get("default-user"),
      db.learning.toArray(),
    ]);
    setProfile(prof ?? null);
    setLeitnerCards(cards);
  };

  const loadServerProfile = async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/user/profile", {
        headers: { Authorization: `Bearer ${useAuthStore.getState().accessToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFormData({
          name: data.name || "",
          phone: data.phone || "",
          chess_com_url: data.chess_com_url || "",
          lichess_url: data.lichess_url || "",
          fide_id_url: data.fide_id_url || "",
          fide_elo: data.fide_elo || "",
          bio: data.bio || ""
        });
        if (data.phone) setInitialPhone(data.phone);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { loadServerProfile(); }, [user]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${useAuthStore.getState().accessToken}`
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.phone) setInitialPhone(data.phone);
      }
    } catch (e) {
      console.error(e);
    }
    setIsSaving(false);
  };

  if (!profile) {
    return (
      <PageContainer className="items-center justify-center">
        <div className="text-slate-500 text-sm italic">
          No profile data yet. Analyze a game to build your player profile.
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <ContentContainer maxWidth="max-w-4xl" className="space-y-8">
        {/* Profile header */}
        <div className="p-6 bg-gradient-to-r from-[#11182c] to-[#0a0f1d] border border-border rounded-2xl flex flex-col md:flex-row items-center text-center md:text-left gap-6">
          <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/20 shrink-0">
            <Award className="w-10 h-10 text-teal-400" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-black text-white">Player Analytics</h1>
            <p className="text-slate-300 text-sm mt-1">Weakness profiling and personalized study plan based on your game history.</p>
          </div>
          <div className="md:ml-auto md:text-right w-full md:w-auto">
            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Estimated ELO</p>
            <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">
              {profile.estimatedElo}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400">{profile.gamesPlayed} games analyzed</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-border pb-px">
          <button
            onClick={() => setActiveTab("analytics")}
            className={`px-4 py-2 font-bold text-sm border-b-2 transition-colors ${activeTab === "analytics" ? "border-teal-500 text-teal-400" : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveTab("account")}
            className={`px-4 py-2 font-bold text-sm border-b-2 transition-colors ${activeTab === "account" ? "border-teal-500 text-teal-400" : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
          >
            Account
          </button>
        </div>

        {activeTab === "analytics" && (
          <div className="space-y-8">
            {/* Stats row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <MiniStat icon={<TrendingUp className="w-4 h-4 text-teal-400" />} label="Games Played" value={String(profile.gamesPlayed)} />
              <MiniStat icon={<Target className="w-4 h-4 text-rose-400" />} label="Weaknesses" value={String(profile.detectedWeaknesses.length)} />
              <MiniStat icon={<BookOpen className="w-4 h-4 text-blue-400" />} label="Concepts in Leitner" value={String(leitnerCards.length)} />
            </div>

        {/* Recommendations */}
        <section className="space-y-4">
          <h2 className="text-xs font-black uppercase tracking-widest text-teal-400">Personalized Study Program</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {RecommendationEngine.getRecommendations(profile.detectedWeaknesses).map((rec) => (
              <div key={rec.id} className="p-6 bg-card border border-border rounded-2xl flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-teal-400 uppercase tracking-wider px-2 py-0.5 rounded bg-black/10 dark:bg-slate-800">{rec.category}</span>
                    <span className="text-xs text-slate-500">Motif: {rec.motif}</span>
                  </div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-200 mb-1">{rec.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{rec.description}</p>
                </div>
                <div className="pt-4 border-t border-border text-xs text-slate-700 dark:text-slate-300 font-semibold italic mt-4">
                  🎯 Suggested: {rec.suggestedAction}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Weaknesses */}
        <section className="space-y-4">
          <h2 className="text-xs font-black uppercase tracking-widest text-teal-400">Identified Weaknesses</h2>
          {profile.detectedWeaknesses.length === 0 ? (
            <div className="p-8 text-center text-slate-500 bg-black/5 dark:bg-slate-900 border border-border rounded-2xl italic text-sm">
              No critical weaknesses detected yet. Analyze more games to build your weakness profile.
            </div>
          ) : (
            <div className="space-y-2">
              {profile.detectedWeaknesses.map((w) => (
                <div key={w.motif} className="p-4 bg-black/5 dark:bg-slate-900 border border-border rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-bold text-sm text-rose-400">{w.motif} ({w.count} occurrences)</span>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">{w.description}</p>
                  </div>
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 ml-4" />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Leitner Concept Box */}
        <section className="space-y-4">
          <h2 className="text-xs font-black uppercase tracking-widest text-teal-400">Leitner Spaced Repetition</h2>
          {leitnerCards.length === 0 ? (
            <div className="p-8 text-center text-slate-500 bg-black/5 dark:bg-slate-900 border border-border rounded-2xl italic text-sm">
              No concepts in Leitner boxes yet. Weaknesses detected from game analysis will populate here.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {leitnerCards.map((card) => {
                const diffDays = Math.ceil((new Date(card.nextReviewDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={card.conceptId} className="p-6 bg-card border border-border rounded-2xl flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-black uppercase text-teal-400 bg-teal-500/10 px-3 py-1 rounded-full">Box {card.box}</span>
                        <span className="text-xs text-slate-600 dark:text-slate-400">Streak: {card.correctStreak}🔥</span>
                      </div>
                      <h3 className="font-bold text-lg mb-1">{card.conceptId} Concept Review</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Next review: {new Date(card.nextReviewDate).toLocaleDateString()}</p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-border flex justify-between items-center">
                      <span className="text-xs font-semibold text-slate-500">
                        {diffDays <= 0 ? "Review Ready! 🎯" : `Due in ${diffDays} days`}
                      </span>
                      <button
                        onClick={() => db.learning.put(SpacedRepetitionManager.updateConceptProgress(card, true)).then(load)}
                        className="px-3 py-1.5 bg-black/10 dark:bg-slate-800 text-teal-400 text-xs font-bold rounded-lg hover:bg-slate-700 transition"
                      >
                        Mark Reviewed
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            )}
          </section>
        </div>
      )}

      {activeTab === "account" && (
        <div className="space-y-8">
          <div className="p-6 bg-card border border-border rounded-2xl">
            <h2 className="text-xl font-black mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-teal-500" /> Account Details
            </h2>
            
            {user ? (
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Email</p>
                  <input type="email" value={user.email} disabled className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 cursor-not-allowed" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Name <span className="text-rose-500">*</span></p>
                    <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all shadow-sm" placeholder="Your Name" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Phone Number <span className="text-rose-500">*</span></p>
                    <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} disabled={!!initialPhone && initialPhone.trim() !== ""} className={`w-full px-4 py-2.5 rounded-xl transition-all shadow-sm ${!!initialPhone && initialPhone.trim() !== "" ? 'bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-500 cursor-not-allowed' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500'}`} placeholder="+1234567890" />
                    {!!initialPhone && initialPhone.trim() !== "" && <p className="text-xs text-slate-500 mt-1.5">Phone number cannot be changed once set.</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Chess.com URL</p>
                    <input type="url" value={formData.chess_com_url} onChange={e => setFormData({...formData, chess_com_url: e.target.value})} className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all shadow-sm" placeholder="https://chess.com/member/username" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Lichess URL</p>
                    <input type="url" value={formData.lichess_url} onChange={e => setFormData({...formData, lichess_url: e.target.value})} className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all shadow-sm" placeholder="https://lichess.org/@/username" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">FIDE Profile URL</p>
                    <input type="url" value={formData.fide_id_url} onChange={e => setFormData({...formData, fide_id_url: e.target.value})} className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all shadow-sm" placeholder="https://ratings.fide.com/profile/..." />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">FIDE ELO</p>
                    <input type="number" value={formData.fide_elo} onChange={e => setFormData({...formData, fide_elo: e.target.value})} className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all shadow-sm" placeholder="e.g. 1500" />
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Short Bio</p>
                  <textarea value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all shadow-sm min-h-[120px] resize-y" placeholder="Tell us a bit about your chess journey..." />
                </div>
                
                <div className="pt-2">
                  <button onClick={handleSaveProfile} disabled={isSaving} className="px-6 py-2.5 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white font-bold rounded-xl transition shadow-lg shadow-teal-500/20">
                    {isSaving ? "Saving..." : "Save Profile"}
                  </button>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Current Plan</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="px-3 py-1 bg-teal-500/10 text-teal-400 text-sm font-black rounded-lg border border-teal-500/20">
                      {user.plan}
                    </span>
                    <span className="text-sm text-slate-500 italic">
                      {user.plan === "FREE" ? "Resets daily" : "Renews on upcoming billing cycle"}
                    </span>
                  </div>
                </div>
                <div className="pt-6 border-t border-border flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => router.push("/pricing")}
                    className="px-6 py-2.5 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-xl transition shadow-lg shadow-teal-500/20"
                  >
                    Upgrade Plan
                  </button>
                  <button
                    onClick={async () => {
                      await fetch("/api/auth/logout", { method: "POST" });
                      clearAuth();
                      router.push("/");
                    }}
                    className="px-6 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-bold rounded-xl transition flex items-center gap-2 border border-rose-500/30"
                  >
                    <LogOut className="w-4 h-4" /> Log out
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-500 mb-4">You are currently playing as a guest.</p>
                <button
                  onClick={() => router.push("/login")}
                  className="px-6 py-2.5 bg-teal-500 text-white font-bold rounded-xl transition shadow-lg shadow-teal-500/20"
                >
                  Log In or Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      </ContentContainer>
      <SignUpPrompt open={showSignUp} onClose={() => setShowSignUp(false)} feature="profile" />
    </PageContainer>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="p-4 bg-card border border-border rounded-2xl flex items-center gap-3">
      {icon}
      <div>
        <p className="text-xs text-slate-600 dark:text-slate-400">{label}</p>
        <p className="text-xl font-black text-foreground">{value}</p>
      </div>
    </div>
  );
}

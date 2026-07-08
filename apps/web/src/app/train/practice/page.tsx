"use client";

import { useState, useEffect } from "react";
import { logActivity } from "@/lib/activity-log";
import { BoardView } from "../../../components/BoardView";
import { Chess } from "@chessinsight/chess-core";
import { playMoveSound, useAuthStore } from "../../store";
import { Dumbbell, RefreshCw, Brain, MessageSquare } from "lucide-react";
import SignUpPrompt from "@/components/SignUpPrompt";
import NavigationGuard from "@/components/NavigationGuard";

const SCENARIOS = [
  { id: "middlegame-1", label: "Open Position Battle", fen: "r1bq1rk1/pp2ppbp/2np1np1/8/3NP3/2N1BP2/PPPQ2PP/R3KB1R w KQ - 0 9", desc: "Practice dynamic middlegame play in a sharp position." },
  { id: "closed-1",     label: "Closed Position Strategy", fen: "r2q1rk1/pp1bppbp/3p1np1/8/2BNP3/2N1BP2/PPP3PP/R2Q1RK1 w - - 0 11", desc: "Find the right plan in a closed, maneuvering position." },
  { id: "endgame-1",    label: "Complex Rook Endgame", fen: "8/5pk1/6p1/4P3/5K2/8/6R1/8 w - - 0 1", desc: "Convert a material advantage in a rook endgame." },
  { id: "attack-1",     label: "Kingside Attack", fen: "r1bq1rk1/ppp2ppp/2np1n2/2b1p3/2B1P3/2NPBN2/PPP2PPP/R2QK2R w KQ - 0 8", desc: "Launch a powerful kingside attack against the castled king." },
];

const TIPS = [
  "Think about all the forcing moves first: checks, captures, threats.",
  "Always ask yourself: what is my opponent's best reply?",
  "Improve your worst-placed piece.",
  "Create a concrete plan before moving.",
  "Consider both candidate moves — the obvious one and the best one.",
  "Safety first: make sure your own pieces and king are safe.",
];

type Phase = "setup" | "playing";

export default function PracticePage() {
  const { accessToken } = useAuthStore();
  const [showSignUp, setShowSignUp] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { logActivity("page_view", "Train - Practice"); }, []);
  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
    if (useAuthStore.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);
  useEffect(() => { if (hydrated && !accessToken) setShowSignUp(true); }, [hydrated, accessToken]);
  const [phase, setPhase] = useState<Phase>("setup");
  const [chess, setChess] = useState<Chess | null>(null);
  const [fen, setFen] = useState("start");
  const [orientation, setOrientation] = useState<"white" | "black">("white");
  const [selectedScenario, setSelectedScenario] = useState(SCENARIOS[0]);
  const [useScenario, setUseScenario] = useState(true);
  const [tip, setTip] = useState(TIPS[0]);
  const [status, setStatus] = useState("");

  const start = () => {
    const startFen = useScenario ? selectedScenario.fen : "start";
    const c = new Chess(startFen);
    setChess(c);
    setFen(startFen);
    setStatus("");
    setTip(TIPS[Math.floor(Math.random() * TIPS.length)]);
    setPhase("playing");
  };

  const handleMove = (from: string, to: string) => {
    if (!chess) return false;
    try {
      const result = chess.move({ from, to, promotion: "q" });
      if (!result) return false;
      playMoveSound(result.san);
      setFen(chess.fen());
      setTip(TIPS[Math.floor(Math.random() * TIPS.length)]);
      if (chess.isCheckmate()) setStatus("Checkmate!");
      else if (chess.isDraw()) setStatus("Draw.");
      return true;
    } catch (e) {
      return false;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-background">
      <NavigationGuard when={phase === "playing"} title="Practice Session" message="Your practice session progress will be lost if you leave.">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-2xl bg-teal-500/15 border border-teal-500/20">
            <Dumbbell className="w-6 h-6 text-teal-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black">Practice</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Free play against yourself or explore training scenarios.</p>
          </div>
        </div>

        {phase === "setup" && (
          <div className="max-w-xl mx-auto space-y-6">
            {/* Mode */}
            <div className="space-y-3">
              <h2 className="text-xs font-black uppercase tracking-widest text-teal-400">Starting Position</h2>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setUseScenario(false)} className={`p-4 rounded-2xl border text-left transition ${!useScenario ? "border-teal-500 bg-teal-500/10" : "border-border bg-card hover:border-slate-600"}`}>
                  <span className="font-bold text-foreground">Standard Start</span>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Begin from the opening position.</p>
                </button>
                <button onClick={() => setUseScenario(true)} className={`p-4 rounded-2xl border text-left transition ${useScenario ? "border-teal-500 bg-teal-500/10" : "border-border bg-card hover:border-slate-600"}`}>
                  <span className="font-bold text-foreground">Training Scenario</span>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Start from a curated position.</p>
                </button>
              </div>
            </div>

            {useScenario && (
              <div className="space-y-2">
                {SCENARIOS.map((s) => (
                  <button key={s.id} onClick={() => setSelectedScenario(s)} className={`w-full p-4 rounded-2xl border text-left transition ${selectedScenario.id === s.id ? "border-teal-500 bg-teal-500/10" : "border-border bg-card hover:border-slate-600"}`}>
                    <span className="font-bold text-foreground text-sm">{s.label}</span>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{s.desc}</p>
                  </button>
                ))}
              </div>
            )}

            {/* Board side */}
            <div className="space-y-2">
              <h2 className="text-xs font-black uppercase tracking-widest text-teal-400">Board Orientation</h2>
              <div className="grid grid-cols-2 gap-3">
                {(["white", "black"] as const).map((c) => (
                  <button key={c} onClick={() => setOrientation(c)} className={`p-3 rounded-xl border flex items-center gap-2 transition ${orientation === c ? "border-teal-500 bg-teal-500/10" : "border-border bg-card hover:border-slate-600"}`}>
                    <div className={`w-6 h-6 rounded-full border-2 ${c === "white" ? "bg-white border-slate-300" : "bg-black/5 dark:bg-slate-900 border-slate-600"}`} />
                    <span className="font-bold text-foreground capitalize text-sm">{c}</span>
                  </button>
                ))}
              </div>
            </div>

            <button onClick={start} className="w-full py-4 bg-teal-500 text-white font-black rounded-2xl hover:bg-teal-600 transition shadow-lg shadow-teal-500/20">
              Start Practice
            </button>
          </div>
        )}

        {phase === "playing" && chess && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="aspect-square rounded-2xl overflow-hidden border border-border">
                <BoardView fen={fen} orientation={orientation} onPieceDrop={handleMove} />
              </div>
              {status && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 font-bold text-sm text-center">
                  {status}
                </div>
              )}
            </div>
            <div className="lg:col-span-5 flex flex-col gap-4">
              {/* Coach tip */}
              <div className="p-5 bg-card border border-border rounded-2xl">
                <div className="flex items-center gap-2 text-teal-400 font-bold text-sm mb-3">
                  <Brain className="w-4 h-4" /> Thinking Tip
                </div>
                <div className="p-3 bg-black/5 dark:bg-slate-900/60 rounded-xl text-sm text-slate-700 dark:text-slate-300 leading-relaxed flex gap-2">
                  <MessageSquare className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  {tip}
                </div>
              </div>
              {/* Game info */}
              <div className="p-4 bg-card border border-border rounded-xl space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Turn</span>
                  <span className="font-bold text-foreground">{chess.turn() === "w" ? "White" : "Black"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Move</span>
                  <span className="font-bold text-foreground">{chess.history().length}</span>
                </div>
                {chess.isCheck() && (
                  <div className="text-orange-400 font-bold">⚠ In Check!</div>
                )}
              </div>
              <button onClick={() => setPhase("setup")} className="flex items-center justify-center gap-2 p-3 bg-teal-500 text-white hover:bg-teal-600 rounded-xl text-sm font-bold transition shadow shadow-teal-500/20">
                <RefreshCw className="w-4 h-4" /> New Practice
              </button>
            </div>
          </div>
        )}
      </div>
      </NavigationGuard>
      <SignUpPrompt open={showSignUp} onClose={() => setShowSignUp(false)} feature="practice" />
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { logActivity } from "@/lib/activity-log";
import { GraduationCap, ChevronRight, ChevronLeft, CheckCircle } from "lucide-react";
import { BoardView } from "@/components/BoardView";
import { Lesson } from "@core/content";
import { useAuthStore } from "@/app/store";
import SignUpPrompt from "@/components/SignUpPrompt";

export function ClientLessons({ lessons }: { lessons: Lesson[] }) {
  const { accessToken } = useAuthStore();
  const [showSignUp, setShowSignUp] = useState(false);
  useEffect(() => { logActivity("page_view", "Learn - Lessons"); }, []);
  useEffect(() => { if (!accessToken) setShowSignUp(true); }, [accessToken]);
  const [activeLessonIdx, setActiveLessonIdx] = useState(0);
  const [slideIdx, setSlideIdx] = useState(0);
  
  if (!lessons || lessons.length === 0) return <div className="p-8 text-slate-500">No lessons configured.</div>;
  
  const lesson = lessons[activeLessonIdx];
  const slide = lesson.slides[slideIdx];

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-2xl bg-teal-500/15 border border-teal-500/20">
            <GraduationCap className="w-6 h-6 text-teal-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black">Interactive Lessons</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Master chess through structured, bite-sized interactive modules.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar / Lesson List */}
          <div className="col-span-12 md:col-span-4 space-y-4">
            {lessons.map((l, i) => {
              const isActive = i === activeLessonIdx;
              return (
                <button
                  key={l.id}
                  onClick={() => { setActiveLessonIdx(i); setSlideIdx(0); }}
                  className={`w-full text-left p-4 rounded-2xl border transition ${isActive ? "bg-teal-500/10 border-teal-500/50" : "bg-card border-border hover:border-teal-500/30"}`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{l.icon}</span>
                    <div>
                      <h3 className={`font-bold ${isActive ? "text-teal-400" : "text-foreground"}`}>{l.title}</h3>
                      <p className="text-xs text-slate-500">{l.category} • {l.duration}</p>
                    </div>
                  </div>
                  {/* Progress bar mock */}
                  <div className="w-full h-1.5 bg-black/20 rounded-full overflow-hidden mt-3">
                    <div className="h-full bg-teal-500" style={{ width: isActive ? `${((slideIdx + 1) / l.slides.length) * 100}%` : "0%" }} />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Main Lesson Content */}
          <div className="col-span-12 md:col-span-8">
            <div className="bg-card border border-border rounded-3xl overflow-hidden flex flex-col h-[600px]">
              {/* Header */}
              <div className="p-6 border-b border-border bg-black/20 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-teal-500 tracking-widest uppercase mb-1 block">Module {activeLessonIdx + 1}</span>
                  <h2 className="text-xl font-bold">{lesson.title}</h2>
                </div>
                <div className="flex items-center gap-2">
                  {lesson.slides.map((_, i) => (
                    <div key={i} className={`w-2.5 h-2.5 rounded-full transition ${i === slideIdx ? "bg-teal-400 scale-125" : i < slideIdx ? "bg-teal-500/50" : "bg-slate-700"}`} />
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 flex flex-col lg:flex-row min-h-0">
                <div className="w-full lg:w-1/2 p-6 flex flex-col justify-center border-r border-border">
                  <h3 className="text-2xl font-black mb-4">{slide.title}</h3>
                  <p className="text-slate-300 leading-relaxed text-lg">{slide.body}</p>
                </div>
                <div className="w-full lg:w-1/2 p-6 flex items-center justify-center bg-black/40">
                  <div className="w-full aspect-square border border-border rounded-xl overflow-hidden shadow-2xl">
                    <BoardView fen={slide.fen} arePiecesDraggable={false} />
                  </div>
                </div>
              </div>

              {/* Footer Controls */}
              <div className="p-6 border-t border-border bg-black/20 flex items-center justify-between">
                <button
                  disabled={slideIdx === 0}
                  onClick={() => setSlideIdx(i => i - 1)}
                  className="flex items-center gap-2 px-6 py-3 bg-black/20 hover:bg-black/40 disabled:opacity-30 rounded-xl font-bold transition text-sm"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                
                {slideIdx === lesson.slides.length - 1 ? (
                  <button onClick={() => {
                    if (activeLessonIdx < lessons.length - 1) {
                      setActiveLessonIdx(i => i + 1);
                      setSlideIdx(0);
                    }
                  }} className="flex items-center gap-2 px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white shadow-lg shadow-teal-500/20 rounded-xl font-bold transition text-sm">
                    Complete Lesson <CheckCircle className="w-4 h-4" />
                  </button>
                ) : (
                  <button onClick={() => setSlideIdx(i => i + 1)} className="flex items-center gap-2 px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white shadow-lg shadow-teal-500/20 rounded-xl font-bold transition text-sm">
                    Next Step <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <SignUpPrompt open={showSignUp} onClose={() => setShowSignUp(false)} feature="lessons" />
    </div>
  );
}

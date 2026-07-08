"use client";

import { useEffect, useRef, useState, ReactNode } from "react";
import { AlertTriangle, X } from "lucide-react";

interface Props {
  when: boolean;
  title?: string;
  message?: string;
  children?: ReactNode;
}

export default function NavigationGuard({ when, title = "Leave?", message = "Your current progress will be lost if you leave this page.", children }: Props) {
  const [showModal, setShowModal] = useState(false);
  const pendingRef = useRef<string | null>(null);

  useEffect(() => {
    if (!when) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [when]);

  useEffect(() => {
    if (!when) return;

    const onPopState = () => {
      history.pushState(null, "", window.location.href);
      setShowModal(true);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [when]);

  useEffect(() => {
    if (!when) return;

    const onDocumentClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement).closest("a");
      if (!link || !link.href) return;
      if (link.href.startsWith(window.location.origin) && !link.href.includes("#")) {
        const currentPath = window.location.pathname;
        const linkPath = new URL(link.href).pathname;
        if (linkPath !== currentPath) {
          e.preventDefault();
          e.stopPropagation();
          pendingRef.current = link.href;
          setShowModal(true);
        }
      }
    };

    document.addEventListener("click", onDocumentClick, true);
    return () => document.removeEventListener("click", onDocumentClick, true);
  }, [when]);

  const handleStay = () => {
    pendingRef.current = null;
    setShowModal(false);
  };

  const handleLeave = () => {
    const href = pendingRef.current;
    pendingRef.current = null;
    setShowModal(false);
    if (href) window.location.href = href;
  };

  return (
    <>
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4" onClick={handleStay}>
          <div className="bg-card border border-border rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 text-center space-y-4">
              <button onClick={handleStay} className="float-right p-1.5 bg-black/5 dark:bg-slate-800 rounded-full hover:bg-black/10 dark:hover:bg-slate-700 transition">
                <X className="w-4 h-4" />
              </button>

              <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center">
                <AlertTriangle className="w-7 h-7 text-amber-500" />
              </div>

              <div>
                <h2 className="text-xl font-black">{title}</h2>
                <p className="text-sm text-slate-500 mt-1.5">{message}</p>
              </div>

              <div className="space-y-3 pt-2">
                <button onClick={handleLeave} className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl transition">
                  Leave Page
                </button>
                <button onClick={handleStay} className="w-full py-3 bg-black/5 dark:bg-slate-800 hover:bg-black/10 dark:hover:bg-slate-700 text-foreground font-semibold rounded-xl transition">
                  Stay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {children}
    </>
  );
}

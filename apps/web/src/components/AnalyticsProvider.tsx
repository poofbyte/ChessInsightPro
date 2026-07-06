"use client";

import { useEffect, Suspense, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { telemetry, eventBus, enqueueEvent } from "@core/telemetry";
import { v4 as uuidv4 } from "uuid";

// We expose this so it can be called by product features
export { telemetry };

function AnalyticsInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname) {
      telemetry.product.pageViewed({
        path: pathname,
        search: searchParams?.toString() || "",
      });
    }
  }, [pathname, searchParams]);

  return null;
}

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;

      // 1. Session ID management
      let sessionId = localStorage.getItem("analytics_session_id");
      if (!sessionId) {
        sessionId = uuidv4();
        localStorage.setItem("analytics_session_id", sessionId);
      }
      telemetry.setSessionId(sessionId as string);

      // 2. Initialize Telemetry Consumer
      // The EventBus publisher pushes to `enqueueEvent` (Offline Queue)
      const unsubscribe = eventBus.subscribe(async (event) => {
        await enqueueEvent(event);
      });

      // Optional: Set up an interval to flush queue if offline -> online
      // The queue flushes automatically on enqueue, but periodic checks help.
      const interval = setInterval(() => {
        import("@core/telemetry").then(({ flushQueue }) => flushQueue());
      }, 30000);

      return () => {
        unsubscribe();
        clearInterval(interval);
      };
    }
  }, []);

  return (
    <>
      <Suspense fallback={null}>
        <AnalyticsInner />
      </Suspense>
      {children}
    </>
  );
}

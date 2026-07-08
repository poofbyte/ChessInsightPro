"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthStore } from "@/app/store";
import { PageContainer } from "@/components/layout/PageContainer";
import { ContentContainer } from "@/components/layout/ContentContainer";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { accessToken, user, clearAuth } = useAuthStore();

  // Guard: wait 200ms for Zustand to rehydrate from localStorage, then redirect if not admin
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!accessToken || !user) {
        sessionStorage.setItem("loginMessage", "Please log in to access the admin panel.");
        router.replace("/login");
        return;
      }
      if (user.role !== "ADMIN") {
        // Stale token - clear auth and redirect to re-login
        clearAuth();
        router.replace("/login?message=Your+session+has+expired.+Please+log+in+again.");
      }
    }, 200);
    return () => clearTimeout(timeout);
  }, [accessToken, user, router, clearAuth]);

  // Show nothing while checking auth
  if (!accessToken || !user || user.role !== "ADMIN") {
    return (
      <PageContainer className="items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-teal-500/30 border-t-teal-500 rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 font-semibold">Verifying access...</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <ContentContainer maxWidth="max-w-7xl">
        {children}
      </ContentContainer>
    </PageContainer>
  );
}


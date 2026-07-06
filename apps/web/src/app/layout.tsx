import "./globals.css";
import type { Metadata } from "next";
import { SidebarShell } from "../components/SidebarShell";
import { AnalyticsProvider } from "../components/AnalyticsProvider";

export const metadata: Metadata = {
  title: "ChessInsight Pro — The Duolingo of Chess Improvement",
  description:
    "Analyze your games with Stockfish 18, get personalized Virtual Coach feedback, track weaknesses, and improve faster.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                let theme = 'dark';
                const stored = localStorage.getItem('chess-insight-settings');
                if (stored) {
                  const state = JSON.parse(stored).state;
                  if (state && state.theme) theme = state.theme;
                }
                if (theme === 'dark') document.documentElement.classList.add('dark');
                else document.documentElement.classList.remove('dark');
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body className="antialiased selection:bg-teal-500 selection:text-foreground bg-background text-foreground" suppressHydrationWarning>
        <AnalyticsProvider>
          <SidebarShell>{children}</SidebarShell>
        </AnalyticsProvider>
      </body>
    </html>
  );
}

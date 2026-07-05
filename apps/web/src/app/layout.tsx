import "./globals.css";
import type { Metadata } from "next";
import { SidebarShell } from "../components/SidebarShell";

export const metadata: Metadata = {
  title: "ChessInsight Pro — The Duolingo of Chess Improvement",
  description:
    "Analyze your games with Stockfish 18, get personalized Virtual Coach feedback, track weaknesses, and improve faster.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased selection:bg-teal-500 selection:text-black bg-[#0a0f1d] text-white">
        <SidebarShell>{children}</SidebarShell>
      </body>
    </html>
  );
}

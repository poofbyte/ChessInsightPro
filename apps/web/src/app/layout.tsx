import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ChessInsight Pro - Spaced Repetition Game Review & Virtual Coach",
  description: "The Duolingo of chess improvement. Ingest FEN/PGN, identify blunders, generate personal puzzle drills, and get roasted by the coach.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased selection:bg-teal-500 selection:text-black">
        {children}
      </body>
    </html>
  );
}

import { NextResponse } from "next/server";
import { dbClient, ensureDbReady } from "@/lib/db";

const DEFAULT_CONFIG = {
  pageTitle: "Train like a Grandmaster.",
  pageSubtitle: "Choose a plan that fits your training volume. Start for free, upgrade when you need more analysis power.",
  plans: [
    {
      id: "free", name: "Free", price: 0, currency: "BDT", period: "mo",
      description: "",
      features: [
        { text: "5 Full Game Reviews / month" },
        { text: "10 Training Sessions / month" },
        { text: "Standard Engine Depth" },
        { text: "Basic Statistics" },
      ],
      highlight: false, badge: "", buttonLabel: "Get Started Free",
      buttonLabelLoggedIn: "Current Plan",
      quotaLimits: { reviewsPerDay: 5, practiceRushPuzzlePerDay: 10 },
    },
    {
      id: "tier1", name: "Pro", price: 100, currency: "BDT", period: "mo",
      description: "7x the value of Free!",
      features: [
        { text: "35 Full Game Reviews / month" },
        { text: "70 Training Sessions / month" },
        { text: "Deep Engine Analysis (Stockfish 17)" },
        { text: "Advanced Statistics & Weakness Tracking" },
        { text: "Priority Email Support" },
      ],
      highlight: true, badge: "Best Value", buttonLabel: "Upgrade to Pro",
      quotaLimits: { reviewsPerMonth: 35, practiceRushPuzzlePerMonth: 70 },
    },
    {
      id: "tier2", name: "Elite", price: 200, currency: "BDT", period: "mo",
      description: "",
      features: [
        { text: "100 Full Game Reviews / month" },
        { text: "200 Training Sessions / month" },
        { text: "Maximum Engine Depth" },
        { text: "Complete Player Profiling" },
        { text: "24/7 Priority Support" },
      ],
      highlight: false, badge: "", buttonLabel: "Upgrade to Elite",
      quotaLimits: { reviewsPerMonth: 100, practiceRushPuzzlePerMonth: 200 },
    },
  ],
  customPlan: {
    title: "Build Your Own Plan",
    description: "Need a specific amount of reviews and sessions? Customize your quotas below.",
    minPrice: 100,
    buttonLabel: "Continue with Custom Plan",
    reviewsLabel: "Game Reviews / mo",
    sessionsLabel: "Training Sessions / mo",
    estimatedPriceLabel: "Estimated Price",
  },
};

export async function GET() {
  try {
    await ensureDbReady();
    const result = await dbClient.execute({
      sql: `SELECT value FROM system_config WHERE key = ?`,
      args: ["pricing_config"],
    });

    if (result.rows.length > 0) {
      try {
        const config = JSON.parse(result.rows[0].value as string);
        return NextResponse.json(config);
      } catch {
        return NextResponse.json(DEFAULT_CONFIG);
      }
    }

    return NextResponse.json(DEFAULT_CONFIG);
  } catch (error) {
    console.error("Pricing config error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

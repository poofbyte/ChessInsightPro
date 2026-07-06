import { NextResponse } from "next/server";
import { dbClient, ensureDbReady } from "@/lib/db";
import { verifyAccessToken } from "@core/auth";

function getAdminUserId(req: Request): string | null {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.split(" ")[1];
  const decoded = verifyAccessToken(token, process.env.JWT_ACCESS_SECRET || "default_access");
  return decoded && decoded.role === "ADMIN" ? decoded.userId : null;
}

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

export async function GET(req: Request) {
  try {
    const adminId = getAdminUserId(req);
    if (!adminId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
    console.error("Admin pricing config error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const adminId = getAdminUserId(req);
    if (!adminId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await ensureDbReady();
    const config = await req.json();

    await dbClient.execute({
      sql: `INSERT INTO system_config (key, value, updated_by) VALUES ('pricing_config', ?, ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_by = excluded.updated_by, updated_at = datetime('now')`,
      args: [JSON.stringify(config), adminId],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin pricing config save error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

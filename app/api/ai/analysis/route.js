import { NextResponse } from "next/server";
import connectDb from "@/lib/connectDb";
import CharacterProfile from "@/models/charchterSchema";
import { runCharacterAnalysis } from "@/lib/runCharacterAnalysis";
import { rateLimit } from "@/lib/rateLimit";
import { authenticateAndRateLimit } from "@/lib/aiRouteUtils";

// 5 requests per 3 minutes for AI analysis
const analysisLimiter = rateLimit({ windowMs: 3 * 60 * 1000, max: 5, name: "api-ai-analysis" });

// POST: Force re-run AI analysis (respects change detection internally)
export async function POST(req) {
  try {
    const { userEmail, errorResponse } = await authenticateAndRateLimit(req, analysisLimiter);
    if (errorResponse) return errorResponse;

    const result = await runCharacterAnalysis(userEmail);

    return NextResponse.json(
      { success: true, ...result },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error analyzing decision:", error);
    return NextResponse.json(
      { error: "Failed to analyze decision: " + error.message },
      { status: 500 }
    );
  }
}

// GET: Fetch existing CharacterProfile without re-analyzing
export async function GET(req) {
  try {
    const { userEmail, errorResponse } = await authenticateAndRateLimit(req);
    if (errorResponse) return errorResponse;

    await connectDb();

    const profile = await CharacterProfile.findOne({ email: userEmail }).lean();

    if (!profile) {
      return NextResponse.json(
        { success: true, profile: null },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        profile: {
          riskTolerance: profile.riskTolerance,
          decisionStyle: profile.decisionStyle,
          traitsSummary: profile.traitsSummary,
        },
        analyzedDecisionIds: profile.analyzedDecisionIds,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching character profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch character profile: " + error.message },
      { status: 500 }
    );
  }
}

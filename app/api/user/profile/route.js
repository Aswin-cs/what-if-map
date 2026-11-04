import { NextResponse } from "next/server";
import connectDb from "@/lib/connectDb";
import CharacterProfile from "@/models/charchterSchema";
import SavedDecision from "@/models/SavedDecision";
import UserHistory from "@/models/UserHistory";
import { runCharacterAnalysis } from "@/lib/runCharacterAnalysis";
import { rateLimit } from "@/lib/rateLimit";
import { authenticateAndRateLimit } from "@/lib/aiRouteUtils";

const profileLimiter = rateLimit({ windowMs: 3 * 60 * 1000, max: 10, name: "api-user-profile" });

export async function GET(req) {
  try {
    const { userEmail, session, errorResponse } = await authenticateAndRateLimit(req);
    if (errorResponse) return errorResponse;

    await connectDb();

    // Run parallel queries with lean projections
    const [profile, savedDoc, historyDoc] = await Promise.all([
      CharacterProfile.findOne({ email: userEmail }).lean(),
      SavedDecision.findOne({ email: userEmail }, { savedDecisions: 1 }).lean(),
      UserHistory.findOne({ email: userEmail }, { "history._id": 1 }).lean(),
    ]);

    const savedDecisions = savedDoc?.savedDecisions || [];
    const totalScenariosCreated = historyDoc?.history?.length || 0;
    const totalSavedDecisions = savedDecisions.length;
    const acceptedAiCount = savedDecisions.filter((d) => d.acceptedAiRecommendation).length;
    const aiAcceptanceRate = totalSavedDecisions > 0
      ? Math.round((acceptedAiCount / totalSavedDecisions) * 100)
      : 0;

    const totalStepsInPaths = savedDecisions.reduce(
      (acc, d) => acc + (d.chosenPath?.length || 0),
      0
    );

    return NextResponse.json(
      {
        success: true,
        user: {
          name: session.user.name || "Scenario Strategist",
          email: userEmail,
          image: session.user.image || null,
        },
        profile: profile
          ? {
              riskTolerance: profile.riskTolerance || "Balanced",
              decisionStyle: profile.decisionStyle || "Calculated Risk-Taker",
              traitsSummary: profile.traitsSummary || "User exhibits structured decision patterns.",
              updatedAt: profile.updatedAt || null,
            }
          : null,
        savedDecisions: [...savedDecisions].reverse(),
        stats: {
          totalScenariosCreated,
          totalSavedDecisions,
          acceptedAiCount,
          aiAcceptanceRate,
          totalStepsInPaths,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in GET /api/user/profile:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const { userEmail, errorResponse } = await authenticateAndRateLimit(req, profileLimiter);
    if (errorResponse) return errorResponse;

    // Run character analysis
    const result = await runCharacterAnalysis(userEmail);

    return NextResponse.json(
      { success: true, ...result },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in POST /api/user/profile:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

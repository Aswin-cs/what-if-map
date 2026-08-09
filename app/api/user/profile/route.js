import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectDb from "@/lib/connectDb";
import CharacterProfile from "@/models/charchterSchema";
import SavedDecision from "@/models/SavedDecision";
import UserHistory from "@/models/UserHistory";
import { runCharacterAnalysis } from "@/lib/runCharacterAnalysis";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const userEmail = session.user.email.toLowerCase();
    await connectDb();

    // 1. Fetch CharacterProfile
    const profile = await CharacterProfile.findOne({ email: userEmail }).lean();

    // 2. Fetch SavedDecisions
    const savedDoc = await SavedDecision.findOne({ email: userEmail }).lean();
    const savedDecisions = savedDoc?.savedDecisions || [];

    // 3. Fetch UserHistory count
    const historyDoc = await UserHistory.findOne({ email: userEmail }).lean();
    const totalScenariosCreated = historyDoc?.history?.length || 0;

    // 4. Compute metrics
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
        savedDecisions: savedDecisions.reverse(), // most recent first
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

// POST endpoint to force refresh AI character analysis
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userEmail = session.user.email.toLowerCase();
    await connectDb();

    // Trigger AI analysis run
    const result = await runCharacterAnalysis(userEmail);

    return NextResponse.json(
      {
        success: true,
        message: "Character analysis updated successfully!",
        analysis: result,
      },
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

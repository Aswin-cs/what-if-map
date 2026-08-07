import { NextResponse } from "next/server";
import connectDb from "@/lib/connectDb";
import CharacterProfile from "@/models/charchterSchema";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { runCharacterAnalysis } from "@/lib/runCharacterAnalysis";

// POST: Force re-run AI analysis (respects change detection internally)
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userEmail = session.user.email?.toLowerCase();

    if (!userEmail) {
      return NextResponse.json({ error: "Unauthorized. Email missing." }, { status: 401 });
    }

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
    console.log("ai analysis route")
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userEmail = session.user.email?.toLowerCase();
    if (!userEmail) {
      return NextResponse.json({ error: "Unauthorized. Email missing." }, { status: 401 });
    }

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


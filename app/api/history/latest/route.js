import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectDb from "@/lib/connectDb";
import UserHistory from "@/models/UserHistory";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please sign in to access scenario history." },
        { status: 401 }
      );
    }

    const userEmail = session.user.email?.toLowerCase();

    if (!userEmail) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Email is missing from session." },
        { status: 401 }
      );
    }

    await connectDb();

    const userDoc = await UserHistory.findOne({ email: userEmail });

    if (!userDoc || !userDoc.history || userDoc.history.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No history found for user",
          data: null,
        },
        { status: 404 }
      );
    }

    // Get the latest generated scenario entry
    const latestEntry = userDoc.history[userDoc.history.length - 1];

    return NextResponse.json(
      {
        success: true,
        _id: latestEntry._id ? latestEntry._id.toString() : null,
        historyId: latestEntry._id ? latestEntry._id.toString() : null,
        userPrompt: latestEntry.userPrompt,
        data: latestEntry.ai_response, // ai_response contains output_1_paths, output_2_flow_edges, etc.
        createdAt: latestEntry.createdAt,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in GET /api/history/latest:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

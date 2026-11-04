import { NextResponse } from "next/server";
import connectDb from "@/lib/connectDb";
import UserHistory from "@/models/UserHistory";
import { authenticateAndRateLimit } from "@/lib/aiRouteUtils";

export async function GET(req) {
  try {
    const { userEmail, errorResponse } = await authenticateAndRateLimit(req);
    if (errorResponse) return errorResponse;

    await connectDb();

    // Use $slice: -1 and .lean() to fetch ONLY the latest history entry from MongoDB
    const userDoc = await UserHistory.findOne(
      { email: userEmail },
      { history: { $slice: -1 } }
    ).lean();

    const latestEntry = userDoc?.history?.[0];
    if (!latestEntry) {
      return NextResponse.json(
        { success: false, error: "No history found for user", data: null },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        _id: latestEntry._id?.toString() || null,
        historyId: latestEntry._id?.toString() || null,
        userPrompt: latestEntry.userPrompt,
        data: latestEntry.ai_response,
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

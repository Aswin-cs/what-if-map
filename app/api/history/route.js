import { NextResponse } from "next/server";
import connectDb from "@/lib/connectDb";
import UserHistory from "@/models/UserHistory";
import mongoose from "mongoose";
import { authenticateAndRateLimit } from "@/lib/aiRouteUtils";

export async function GET(req) {
  try {
    const { userEmail, errorResponse } = await authenticateAndRateLimit(req);
    if (errorResponse) return errorResponse;

    await connectDb();

    // Use .lean() to bypass Mongoose hydration overhead
    const userDoc = await UserHistory.findOne({ email: userEmail }).lean();

    if (!userDoc?.history || userDoc.history.length === 0) {
      return NextResponse.json(
        { success: true, history: [] },
        { status: 200 }
      );
    }

    const historyList = userDoc.history
      .map((item) => ({
        _id: item._id.toString(),
        userPrompt: item.userPrompt,
        ai_response: item.ai_response,
        createdAt: item.createdAt,
      }))
      .reverse();

    return NextResponse.json(
      { success: true, history: historyList },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in GET /api/history:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    const { userEmail, errorResponse } = await authenticateAndRateLimit(req);
    if (errorResponse) return errorResponse;

    const { searchParams } = new URL(req.url);
    let historyId = searchParams.get("id");

    if (!historyId) {
      const body = await req.json().catch(() => ({}));
      historyId = body.historyId || body._id || body.id;
    }

    if (!historyId || !mongoose.Types.ObjectId.isValid(historyId)) {
      return NextResponse.json(
        { success: false, error: "Valid history item ID is required." },
        { status: 400 }
      );
    }

    await connectDb();

    const result = await UserHistory.updateOne(
      { email: userEmail },
      { $pull: { history: { _id: new mongoose.Types.ObjectId(historyId) } } }
    );

    return NextResponse.json(
      { success: true, message: "History item deleted successfully", result },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in DELETE /api/history:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

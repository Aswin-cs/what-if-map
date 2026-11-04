import { NextResponse } from "next/server";
import connectDb from "@/lib/connectDb";
import UserHistory from "@/models/UserHistory";
import mongoose from "mongoose";
import { authenticateAndRateLimit } from "@/lib/aiRouteUtils";

export async function GET(req, { params }) {
  try {
    const { userEmail, errorResponse } = await authenticateAndRateLimit(req);
    if (errorResponse) return errorResponse;

    const { object_id } = await params;
    if (!object_id || !mongoose.Types.ObjectId.isValid(object_id)) {
      return NextResponse.json(
        { success: false, error: "Valid object_id is required." },
        { status: 400 }
      );
    }

    await connectDb();

    // Query exact matching subdocument using positional projection and .lean()
    const userDoc = await UserHistory.findOne(
      { email: userEmail, "history._id": new mongoose.Types.ObjectId(object_id) },
      { "history.$": 1 }
    ).lean();

    const historyItem = userDoc?.history?.[0];
    if (!historyItem) {
      return NextResponse.json(
        { success: false, error: `History item with id '${object_id}' not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        _id: historyItem._id.toString(),
        userPrompt: historyItem.userPrompt,
        ai_response: historyItem.ai_response,
        createdAt: historyItem.createdAt,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in GET /api/history/specific/[object_id]:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

import { getReactFlowMap } from "@/lib/aiService";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectDb from "@/lib/connectDb";
import UserHistory from "@/models/UserHistory";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please sign in to generate scenarios." },
        { status: 401 }
      );
    }

    const userEmail = session.user.email?.toLowerCase();

    if (!userEmail) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. User email is missing from session." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { userPrompt } = body || {};

    if (!userPrompt) {
      return NextResponse.json(
        { success: false, error: "User prompt is required" },
        { status: 400 }
      );
    }

    // Generate AI scenario data
    const json = await getReactFlowMap(userPrompt);

    let historyId = null;

    // Save to MongoDB under authorized user email
    try {
      await connectDb();
      const updatedDoc = await UserHistory.findOneAndUpdate(
        { email: userEmail },
        {
          $push: {
            history: {
              userPrompt: userPrompt,
              ai_response: json, // Stores only the data object without success wrapper
            },
          },
        },
        { upsert: true, returnDocument: "after" }
      );
      const lastItem =
        updatedDoc?.history?.[updatedDoc.history.length - 1];
      if (lastItem) {
        historyId = lastItem._id.toString();
      }
    } catch (dbError) {
      console.error("Error saving history to MongoDB:", dbError);
    }

    return NextResponse.json(
      { success: true, data: json, _id: historyId },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in POST /api/ai:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

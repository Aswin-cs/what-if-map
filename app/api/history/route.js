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
        { success: false, error: "Unauthorized. Please sign in to view your prompt history." },
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
        { success: true, history: [] },
        { status: 200 }
      );
    }

    // Format history entries using ObjectId _id string as unique key
    const historyList = userDoc.history
      .map((item) => ({
        _id: item._id.toString(),
        userPrompt: item.userPrompt,
        ai_response: item.ai_response,
        createdAt: item.createdAt,
      }))
      .reverse(); // Latest scenarios first

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
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please sign in to delete history items." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    let historyId = searchParams.get("id");

    if (!historyId) {
      const body = await req.json().catch(() => ({}));
      historyId = body.historyId || body._id || body.id;
    }

    if (!historyId) {
      return NextResponse.json(
        { success: false, error: "History item ID is required" },
        { status: 400 }
      );
    }

    const userEmail = session.user.email?.toLowerCase();

    await connectDb();

    const result = await UserHistory.updateOne(
      { email: userEmail },
      { $pull: { history: { _id: historyId } } }
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

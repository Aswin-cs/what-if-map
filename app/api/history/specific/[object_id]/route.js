import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectDb from "@/lib/connectDb";
import UserHistory from "@/models/UserHistory";

export async function GET(req, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const { object_id } = await params;

    if (!object_id) {
      return NextResponse.json(
        { success: false, error: "object_id is required." },
        { status: 400 }
      );
    }

    const userEmail = session.user.email?.toLowerCase();
    if (!userEmail) {
      return NextResponse.json(
        { success: false, error: "Email missing from session." },
        { status: 401 }
      );
    }

    await connectDb();

    const userDoc = await UserHistory.findOne({ email: userEmail });

    if (!userDoc || !userDoc.history) {
      return NextResponse.json(
        { success: false, error: "No history found." },
        { status: 404 }
      );
    }

    const historyItem = userDoc.history.find(
      (item) => item._id.toString() === object_id
    );

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

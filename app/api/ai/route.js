import { getReactFlowMap } from "@/lib/aiService";
import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimit";
import { authenticateAndRateLimit, saveOrUpdateUserHistory } from "@/lib/aiRouteUtils";

// 5 requests per 3 minutes for AI generation
const aiLimiter = rateLimit({ windowMs: 3 * 60 * 1000, max: 5, name: "api-ai" });

export async function POST(req) {
  try {
    const { userEmail, errorResponse } = await authenticateAndRateLimit(req, aiLimiter);
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const { userPrompt } = body || {};

    if (!userPrompt) {
      return NextResponse.json(
        { success: false, error: "User prompt is required" },
        { status: 400 }
      );
    }

    // Generate AI scenario map
    const json = await getReactFlowMap(userPrompt);

    // Save new scenario to MongoDB history under authorized user email
    const historyId = await saveOrUpdateUserHistory({
      userEmail,
      userPrompt,
      aiResponse: json,
      createNew: true,
    });

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

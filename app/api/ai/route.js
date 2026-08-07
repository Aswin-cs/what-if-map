import { GoogleGenAI } from "@google/genai";
import { reactFlowMapSchema } from "@/models/ReactFlowMapSchema";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectDb from "@/lib/connectDb";
import UserHistory from "@/models/UserHistory";

async function getReactFlowMap(userPrompt) {
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  const systemInstructions = `
    You are an AI Decision Engine powering the "What-If" Map platform.
    Analyze the scenario and generate 2 to 5 primary main paths ('path1', 'path2', etc.).
    
    RULES FOR NESTED SUBPATHS:
    - Subpaths are OPTIONAL. Only add subpaths if the path naturally breaks down into secondary choices or outcomes.
    - If adding subpaths, use hierarchical dot notation for IDs:
      * Main paths: 'path1', 'path2'
      * Level 1 subpaths: 'subpath1.1', 'subpath1.2'
      * Level 2 subpaths: 'subpath1.1.1', 'subpath1.1.2'
    - Set 'has_subpaths' to true if 'subpaths' array is present, otherwise false.
    [SECTION RULES]:
- 'output_1_paths': Nodes array starting at path0 (x: 50, y: 380),also give some gaps or space between nodes or paths  its  x-y values should be in multiple of 80 or 150 for better visualization
- 'output_2_flow_edges': Edges connecting parent nodes to child nodes.
- 'output_3_recommendation_and_advice': Best lineage and strategic advice.

[EDGE CREATION RULES]:
- For every non-root node (source -> target), create a corresponding edge in 'output_2_flow_edges'.
- Edge ID format: 'e-{source_id}-{target_id}' (e.g. 'e-path0-path1').
- Set 'sourceHandle': 'source-right' and 'targetHandle': 'target-left'.
- Default edge style: stroke: '#52525b', strokeWidth: 2, markerEnd type: 'arrowclosed', color: '#71717a'.
- For edges that fall along the 'recommended_lineage', highlight them with stroke: '#22c55e' and marker color: '#22c55e'.
  `;

  const models = ["gemini-flash-latest", "gemini-3.6-flash", "gemini-3-preview", "gemini-3.5-flash", "gemini-2.5-flash", "gemini-2.5-pro"];
  let response = null;
  let lastError = null;

  for (const modelName of models) {
    try {
      console.log(modelName)
      response = await ai.models.generateContent({
        model: modelName,
        contents: `${systemInstructions}\n\nScenario: ${userPrompt}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: reactFlowMapSchema,
          temperature: 0.7,
        },
      });
      if (response) break;
    } catch (err) {
      console.warn(`Model '${modelName}' failed, trying next candidate:`, err.message || err);
      lastError = err;
    }
  }

  if (!response) {
    throw new Error(`All AI models failed. Last error: ${lastError?.message || lastError}`);
  }

  const jsonResponse = JSON.parse(response.text);
  return jsonResponse;
}

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

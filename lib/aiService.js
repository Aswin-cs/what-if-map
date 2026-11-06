import { GoogleGenAI } from "@google/genai";
import { reactFlowMapSchema } from "@/models/ReactFlowMapSchema";

const AI_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-flash-lite-latest",
  "gemini-3.5-flash",
  "gemini-3.8-flash",
];

let genAiClient = null;
function getGenAiClient() {
  if (!genAiClient) {
    genAiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return genAiClient;
}

// Schema for updating only selected path nodes (excluding root path0)
const editSelectedPathSchema = {
  type: "object",
  properties: {
    updated_path_nodes: {
      type: "array",
      description: "Array of updated node objects for the selected path, excluding root node path0.",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          label: { type: "string" },
          msg: { type: "string" },
          category: { type: "string" },
        },
        required: ["id", "label", "msg"],
      },
    },
    output_3_recommendation_and_advice: {
      type: "object",
      properties: {
        recommended_path_id: { type: "string" },
        recommended_lineage: { type: "array", items: { type: "string" } },
        strategic_advice: { type: "string" },
      },
      required: ["recommended_path_id", "recommended_lineage", "strategic_advice"],
    },
  },
  required: ["updated_path_nodes", "output_3_recommendation_and_advice"],
};

// Schema for continuing story beyond an end node
const continuationResponseSchema = {
  type: "object",
  properties: {
    continuation_nodes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          label: { type: "string" },
          msg: { type: "string" },
          category: { type: "string" },
        },
        required: ["id", "label", "msg"],
      },
    },
    output_3_recommendation_and_advice: {
      type: "object",
      properties: {
        recommended_path_id: { type: "string" },
        recommended_lineage: { type: "array", items: { type: "string" } },
        strategic_advice: { type: "string" },
      },
      required: ["recommended_path_id", "recommended_lineage", "strategic_advice"],
    },
  },
  required: ["continuation_nodes", "output_3_recommendation_and_advice"],
};

/**
 * Executes a Gemini request with model fallback.
 */
export async function callGeminiWithFallback({ prompt, schema, temperature = 0.7 }) {
  const ai = getGenAiClient();
  let lastError = null;

  for (const model of AI_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
          temperature,
        },
      });
      if (response?.text) {
        return JSON.parse(response.text);
      }
    } catch (err) {
      console.warn(`[AI Service] Model '${model}' failed:`, err.message || err);
      lastError = err;
    }
  }

  throw new Error(`All AI models failed. Last error: ${lastError?.message || lastError}`);
}

/**
 * Calculates hierarchical 2D node positions using BFS branching.
 * Root is placed at { x: 50, y: 380 }. Children stride +280 horizontally and fan out vertically.
 */
export function calculateNodePositions(nodes = [], edges = []) {
  if (!Array.isArray(nodes) || nodes.length === 0) return nodes;

  const childrenMap = new Map();
  const parentMap = new Map();

  // 1. Build relations from edges
  if (Array.isArray(edges)) {
    for (const edge of edges) {
      if (edge.source && edge.target) {
        if (!childrenMap.has(edge.source)) childrenMap.set(edge.source, []);
        childrenMap.get(edge.source).push(edge.target);
        parentMap.set(edge.target, edge.source);
      }
    }
  }

  // 2. Supplement from node.data.parent_id
  for (const node of nodes) {
    const pId = node.data?.parent_id;
    if (pId && !parentMap.has(node.id) && pId !== node.id) {
      if (!childrenMap.has(pId)) childrenMap.set(pId, []);
      childrenMap.get(pId).push(node.id);
      parentMap.set(node.id, pId);
    }
  }

  // 3. Identify Root Node
  const rootNode =
    nodes.find((n) => n.id === "path0") ||
    nodes.find((n) => n.data?.node_type === "root") ||
    nodes.find((n) => !parentMap.has(n.id)) ||
    nodes[0];
  const rootId = rootNode?.id || "path0";

  // 4. Attach any unparented nodes to root or parent path
  for (const node of nodes) {
    if (node.id === rootId || parentMap.has(node.id)) continue;

    let targetParent = rootId;
    if (/^subpath(\d+)\./i.test(node.id)) {
      const mainPathId = `path${node.id.split(".")[0].replace(/^subpath/i, "")}`;
      if (nodes.some((n) => n.id === mainPathId)) targetParent = mainPathId;
    }

    if (!childrenMap.has(targetParent)) childrenMap.set(targetParent, []);
    childrenMap.get(targetParent).push(node.id);
    parentMap.set(node.id, targetParent);
  }

  // 5. Compute BFS positions
  const positions = new Map();
  positions.set(rootId, { x: 50, y: 380 });

  const rootChildren = childrenMap.get(rootId) || [];
  let maxSubChildren = 1;
  for (const cId of rootChildren) {
    const subCount = (childrenMap.get(cId) || []).length;
    if (subCount > maxSubChildren) maxSubChildren = subCount;
  }
  const mainSpacing = Math.max(220, maxSubChildren * 150);

  const queue = [rootId];
  const visited = new Set([rootId]);

  while (queue.length > 0) {
    const parentId = queue.shift();
    const parentPos = positions.get(parentId) || { x: 50, y: 380 };
    const rawChildren = childrenMap.get(parentId) || [];
    const children = rawChildren.filter((cId) => !visited.has(cId));

    const count = children.length;
    const spacing = parentId === rootId ? mainSpacing : (count > 2 ? 140 : 160);
    const baseX = parentPos.x + 280;

    children.forEach((childId, idx) => {
      visited.add(childId);
      const offsetY = (idx - (count - 1) / 2) * spacing;
      positions.set(childId, {
        x: Math.round(baseX),
        y: Math.round(parentPos.y + offsetY),
      });
      queue.push(childId);
    });
  }

  // 6. Return mapped nodes with assigned positions
  return nodes.map((node, idx) => ({
    ...node,
    type: node.type || "custom",
    position: positions.get(node.id) || {
      x: 330,
      y: Math.round(380 + (idx - nodes.length / 2) * 160),
    },
  }));
}

/**
 * Normalizes edge objects with standard handles, stroke styling, and markers.
 */
function normalizeEdges(edges = []) {
  if (!Array.isArray(edges)) return [];
  return edges.map((e) => ({
    ...e,
    sourceHandle: e.sourceHandle || "source-right",
    targetHandle: e.targetHandle || "target-left",
    style: e.style || { stroke: "#52525b", strokeWidth: 2 },
    markerEnd: e.markerEnd || { type: "arrowclosed", color: "#71717a" },
  }));
}

/**
 * Generates a complete ReactFlow scenario map from a user prompt.
 */
export async function getReactFlowMap(userPrompt) {
  const systemPrompt = `You are an AI Decision Engine for the "What-If" Map platform.
Analyze the scenario and generate 2 to 5 primary paths ('path1', 'path2', etc.).

[CRITICAL & NEGATIVE THINKING]:
- Give significant weight to critical risks, unintended failure modes, and realistic downside consequences.
- Detail causal chains of how and why decisions might fail so the user understands blind spots.

[STRUCTURE]:
- 'output_1_paths': Node array starting at root 'path0'. Include id, type: 'custom', and data (label, msg, node_type: 'root'|'main_path'|'subpath', parent_id).
- 'output_2_flow_edges': Edges connecting parent to child nodes (id: 'e-{source}-{target}', source, target).
- 'output_3_recommendation_and_advice': Best lineage array and strategic advice.`;

  const result = await callGeminiWithFallback({
    prompt: `${systemPrompt}\n\nScenario: ${userPrompt}`,
    schema: reactFlowMapSchema,
    temperature: 0.7,
  });

  if (result?.output_1_paths) {
    result.output_1_paths = calculateNodePositions(
      result.output_1_paths,
      result.output_2_flow_edges || []
    );
  }

  if (result?.output_2_flow_edges) {
    result.output_2_flow_edges = normalizeEdges(result.output_2_flow_edges);
  }

  return result;
}

/**
 * Edits downstream nodes along a selected path (excluding root path0).
 */
export async function editSelectedPathNodes(userPrompt, selectedPathNodes, nodes, edges) {
  const rootNode = selectedPathNodes[0];
  const pathNodesToEdit = selectedPathNodes.slice(1);

  const pathContext = selectedPathNodes
    .map((n, i) => `Step ${i} [${n.id === rootNode?.id ? "ROOT (LOCKED)" : "EDITABLE"}]: ID=${n.id}, Title="${n.data?.label || n.id}", Details="${n.data?.msg || ""}"`)
    .join("\n");

  const editPrompt = `You are an AI Decision Engine for the "What-If" Map platform.
User edited scenario prompt to: "${userPrompt}".

[CURRENT PATH]:
${pathContext}

[RULES]:
1. Root '${rootNode?.id || "path0"}' must NOT be modified or included in 'updated_path_nodes'.
2. Edit ONLY nodes: ${pathNodesToEdit.map((n) => n.id).join(", ")}.
3. Keep exact node IDs unchanged. Update label, msg, and category to reflect the new prompt narrative.
4. Provide updated 'output_3_recommendation_and_advice'.`;

  const result = await callGeminiWithFallback({
    prompt: editPrompt,
    schema: editSelectedPathSchema,
    temperature: 0.7,
  });

  const updatedMap = new Map();
  (result.updated_path_nodes || []).forEach((item) => {
    if (item.id && item.id !== rootNode?.id) updatedMap.set(item.id, item);
  });

  const finalNodes = nodes.map((n) => {
    const updated = updatedMap.get(n.id);
    if (!updated) return n;
    return {
      ...n,
      data: {
        ...n.data,
        label: updated.label || n.data?.label || n.id,
        msg: updated.msg || n.data?.msg || "",
        category: updated.category || n.data?.category || "action",
      },
    };
  });

  return {
    finalNodes,
    finalEdges: normalizeEdges(edges),
    finalAdvice: result.output_3_recommendation_and_advice || null,
  };
}

/**
 * Generates story continuation nodes extending from a target end node.
 */
export async function generateStoryContinuation({
  userPrompt,
  endNodeId,
  endNodeLabel,
  endNodeStory,
  chosenPath = [],
  existingNodes = [],
  existingEdges = [],
}) {
  const pathContext = chosenPath
    .map((s, i) => `Step ${i + 1}: [ID: ${s.id}] ${s.label || s.pathName || s.id} - ${s.msg || s.story || ""}`)
    .join("\n");

  const prompt = `You are an AI Decision Engine for "What-If" Map.
Continue the story beyond the chosen end node.

[SCENARIO]: ${userPrompt || "Scenario Decision"}
[CURRENT PATH]:
${pathContext || `End node: ${endNodeLabel}`}
[END NODE]: ID=${endNodeId}, Title="${endNodeLabel}", Details="${endNodeStory || "N/A"}"

[TASK]:
1. Generate 2 to 4 creative continuation outcomes branching from '${endNodeId}'. Assign IDs like '${endNodeId}_ext1', '${endNodeId}_ext2'.
2. Provide updated 'output_3_recommendation_and_advice' with optimal leaf node and lineage.`;

  const result = await callGeminiWithFallback({
    prompt,
    schema: continuationResponseSchema,
    temperature: 0.7,
  });

  const rawNodes = result.continuation_nodes || [];
  const recommendation = result.output_3_recommendation_and_advice || {
    recommended_path_id: String(endNodeId),
    recommended_lineage: chosenPath.map((p) => String(p.id)),
    strategic_advice: "Path continued.",
  };

  const targetNode = existingNodes.find((n) => n.id === endNodeId);
  const baseX = (targetNode?.position?.x ?? 320) + 280;
  const baseY = targetNode?.position?.y ?? 380;
  const count = rawNodes.length;

  const newNodes = rawNodes.map((item, idx) => {
    const newId = item.id ? String(item.id) : `${endNodeId}_ext${idx + 1}`;
    const offsetY = (idx - (count - 1) / 2) * 160;

    return {
      id: newId,
      type: "custom",
      position: { x: Math.round(baseX), y: Math.round(baseY + offsetY) },
      data: {
        label: item.label || `Outcome ${idx + 1}`,
        msg: item.msg || "",
        node_type: "subpath",
        parent_id: String(endNodeId),
        category: item.category || "mindset",
      },
    };
  });

  const newEdges = newNodes.map((n) => ({
    id: `e-${endNodeId}-${n.id}`,
    source: String(endNodeId),
    target: n.id,
    sourceHandle: "source-right",
    targetHandle: "target-left",
    style: { stroke: "#3b82f6", strokeWidth: 2 },
    markerEnd: { type: "arrowclosed", color: "#3b82f6" },
  }));

  const allNodes = [...existingNodes, ...newNodes];
  const allEdges = [...normalizeEdges(existingEdges), ...newEdges];

  return {
    newNodes,
    newEdges,
    allNodes,
    allEdges,
    updatedAdvice: recommendation.strategic_advice,
    output_3_recommendation_and_advice: recommendation,
  };
}

export const reactFlowMapSchema = {
  type: "object",
  properties: {
    // 1. NODES SECTION
    output_1_paths: {
      type: "array",
      description: "Array of decision tree nodes starting at root 'path0'.",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          type: { type: "string", description: "Default 'custom'" },
          data: {
            type: "object",
            properties: {
              label: { type: "string" },
              msg: { type: "string" },
              node_type: { type: "string", enum: ["root", "main_path", "subpath"] },
              parent_id: { type: "string", nullable: true },
              category: { type: "string", description: "mindset, action, risk, or outcome" },
            },
            required: ["label", "msg", "node_type"],
          },
        },
        required: ["id", "type", "data"],
      },
    },

    // 2. EDGES SECTION
    output_2_flow_edges: {
      type: "array",
      description: "Array of edges connecting parent and child nodes.",
      items: {
        type: "object",
        properties: {
          id: { type: "string", description: "e.g., 'e-path0-path1'" },
          source: { type: "string" },
          target: { type: "string" },
        },
        required: ["id", "source", "target"],
      },
    },

    // 3. RECOMMENDATIONS SECTION
    output_3_recommendation_and_advice: {
      type: "object",
      properties: {
        recommended_path_id: { type: "string" },
        recommended_lineage: {
          type: "array",
          items: { type: "string" },
        },
        strategic_advice: { type: "string" },
      },
      required: ["recommended_path_id", "recommended_lineage", "strategic_advice"],
    },
  },
  required: ["output_1_paths", "output_2_flow_edges", "output_3_recommendation_and_advice"],
};

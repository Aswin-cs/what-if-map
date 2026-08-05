export const reactFlowMapSchema = {
  type: "object",
  properties: {
    // 1. NODES SECTION
    output_1_paths: {
      type: "array",
      description: "Array of React Flow nodes.",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          type: { type: "string", description: "Default 'custom'" },
          position: {
            type: "object",
            properties: {
              x: { type: "integer" },
              y: { type: "integer" }
            },
            required: ["x", "y"]
          },
          data: {
            type: "object",
            properties: {
              label: { type: "string" },
              msg: { type: "string" },
              node_type: { type: "string", enum: ["root", "main_path", "subpath"] },
              parent_id: { type: "string", nullable: true }
            },
            required: ["label", "msg", "node_type"]
          }
        },
        required: ["id", "type", "position", "data"]
      }
    },

    // 2. EDGES SECTION
    output_2_flow_edges: {
      type: "array",
      description: "Array of React Flow edges connecting parent and child nodes.",
      items: {
        type: "object",
        properties: {
          id: { type: "string", description: "e.g., 'e-path0-path1'" },
          source: { type: "string" },
          target: { type: "string" },
          sourceHandle: { type: "string", description: "e.g., 'source-right'" },
          targetHandle: { type: "string", description: "e.g., 'target-left'" },
          style: {
            type: "object",
            properties: {
              stroke: { type: "string" },
              strokeWidth: { type: "integer" }
            },
            required: ["stroke", "strokeWidth"]
          },
          markerEnd: {
            type: "object",
            properties: {
              type: { type: "string", description: "e.g., 'arrowclosed'" },
              color: { type: "string" }
            },
            required: ["type", "color"]
          }
        },
        required: ["id", "source", "target", "sourceHandle", "targetHandle", "style", "markerEnd"]
      }
    },

    // 3. RECOMMENDATIONS SECTION
    output_3_recommendation_and_advice: {
      type: "object",
      properties: {
        recommended_path_id: { type: "string" },
        recommended_lineage: {
          type: "array",
          items: { type: "string" }
        },
        strategic_advice: { type: "string" }
      },
      required: ["recommended_path_id", "recommended_lineage", "strategic_advice"]
    }
  },
  required: [
    "output_1_paths", 
    "output_2_flow_edges", 
    "output_3_recommendation_and_advice"
  ]
};
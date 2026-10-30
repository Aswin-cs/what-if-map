/**
 * AI Processing stages and word sets for dynamic loading states.
 * Grouped into progressive stages from semantic analysis to scenario graph generation.
 */

export const AI_PROCESSING_WORD_SETS = {
  // Stage 1: Ingestion & Semantic Analysis
  analysis: [
    "Analyzing scenario...",
    "Parsing key variables...",
    "Extracting core premise...",
  ],

  // Stage 2: Divergent Reasoning & Possibility Exploration
  simulation: [
    "Synthesizing paths...",
    "Branching decision trees...",
    "Simulating outcomes...",
    "Mapping causal chains...",
  ],

  // Stage 3: Quantitative & Impact Evaluation
  evaluation: [
    "Evaluating probabilities...",
    "Calculating systemic impact...",
    "Assessing risk vectors...",
  ],

  // Stage 4: Synthesis & Node Graph Assembly
  synthesis: [
    "Structuring node graph...",
    "Generating pathways...",
    "Finalizing scenario map...",
  ],
};

// Flattened sequential array of words across all stages
export const AI_PROCESSING_WORDS = [
  ...AI_PROCESSING_WORD_SETS.analysis,
  ...AI_PROCESSING_WORD_SETS.simulation,
  ...AI_PROCESSING_WORD_SETS.evaluation,
  ...AI_PROCESSING_WORD_SETS.synthesis,
];


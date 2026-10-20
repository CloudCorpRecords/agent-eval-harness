// Shared types for the eval harness.
// Independent prototype. Not affiliated with Databricks. All agents and data are simulated and local.

export interface EvalCase {
  id: string;
  category: string;
  question: string;
  context: string;
  expectedKeywords: string[];
  expectedExact?: string;
  requireCitations: boolean;
  outOfScope: boolean;
}

export interface CaseScores {
  keyword: number; // 0..1 keyword coverage
  exact: number | null; // 0 or 1, null when no expectedExact is defined
  format: number; // 0..1 format checks
  composite: number; // 0.5 * keyword + 0.5 * format
}

export interface CaseResult {
  caseId: string;
  category: string;
  output: string;
  scores: CaseScores;
}

export interface Aggregate {
  meanKeyword: number;
  meanFormat: number;
  meanExact: number | null;
  meanComposite: number;
  n: number;
}

export interface Experiment {
  id: string;
  agent: string;
  label: string;
  params: Record<string, string | number>;
  startedAt: string;
  durationMs: number;
  results: CaseResult[];
  aggregate: Aggregate;
}

// Transparent, deterministic scorers. Every rule is written out below so the
// numbers in the report are fully reproducible by hand if needed.
import type { CaseScores, EvalCase } from "./types.ts";

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9@.\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Fraction of expected keywords present in the output (case-insensitive).
export function keywordCoverage(output: string, c: EvalCase): number {
  if (c.expectedKeywords.length === 0) return 1;
  const hay = normalize(output);
  let hits = 0;
  for (const kw of c.expectedKeywords) {
    if (hay.includes(normalize(kw))) hits++;
  }
  return hits / c.expectedKeywords.length;
}

// 1 when the normalized output equals the expected answer exactly.
// null when the case has no expectedExact (excluded from exact aggregates).
export function exactScore(output: string, c: EvalCase): number | null {
  if (c.expectedExact === undefined) return null;
  return normalize(output) === normalize(c.expectedExact) ? 1 : 0;
}

// Format checks, all documented:
// - out-of-scope cases: 1.0 only if the output is a refusal.
// - answered cases: 0.5 for citations (when required; auto-credit when not),
//   0.5 for staying within 280 characters.
export function formatScore(output: string, c: EvalCase): number {
  if (c.outOfScope) {
    return /cannot answer|unable to answer|do not have/i.test(output) ? 1 : 0;
  }
  let s = 0;
  s += c.requireCitations ? (/\[\d+\]/.test(output) ? 0.5 : 0) : 0.5;
  s += output.length <= 280 ? 0.5 : 0;
  return s;
}

export function scoreCase(output: string, c: EvalCase): CaseScores {
  const keyword = keywordCoverage(output, c);
  const exact = exactScore(output, c);
  const format = formatScore(output, c);
  const composite = 0.5 * keyword + 0.5 * format;
  return { keyword, exact, format, composite };
}

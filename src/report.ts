// Comparison report between two experiments. All deltas are (b minus a).
// Regressions, ties, and shared failures are all reported, nothing is hidden.
import type { Experiment } from "./types.ts";

export interface PerCaseDelta {
  caseId: string;
  category: string;
  aComposite: number;
  bComposite: number;
  delta: number;
}

export interface Comparison {
  aId: string;
  bId: string;
  aAgent: string;
  bAgent: string;
  perCase: PerCaseDelta[];
  meanDelta: number;
  regressions: PerCaseDelta[]; // b worse than a
  improvements: PerCaseDelta[]; // b better than a
  contentFailures: PerCaseDelta[]; // keyword coverage below 0.5 for both
}

export function compareExperiments(a: Experiment, b: Experiment): Comparison {
  const byId = new Map(a.results.map((r) => [r.caseId, r]));
  const perCase: PerCaseDelta[] = [];
  const contentFailures: PerCaseDelta[] = [];
  for (const rb of b.results) {
    const ra = byId.get(rb.caseId);
    if (!ra) continue;
    const delta = rb.scores.composite - ra.scores.composite;
    const row: PerCaseDelta = {
      caseId: rb.caseId,
      category: rb.category,
      aComposite: ra.scores.composite,
      bComposite: rb.scores.composite,
      delta,
    };
    perCase.push(row);
    if (ra.scores.keyword < 0.5 && rb.scores.keyword < 0.5) {
      contentFailures.push(row);
    }
  }
  const regressions = perCase.filter((r) => r.delta < 0);
  const improvements = perCase.filter((r) => r.delta > 0);
  return {
    aId: a.id,
    bId: b.id,
    aAgent: a.agent,
    bAgent: b.agent,
    perCase,
    meanDelta: b.aggregate.meanComposite - a.aggregate.meanComposite,
    regressions,
    improvements,
    contentFailures,
  };
}

function fmt(n: number): string {
  return (n >= 0 ? "+" : "") + n.toFixed(2);
}

export function printComparison(cmp: Comparison): string {
  const lines: string[] = [];
  lines.push(`Comparison: ${cmp.aAgent} (${cmp.aId}) vs ${cmp.bAgent} (${cmp.bId})`);
  lines.push(`Mean composite delta: ${fmt(cmp.meanDelta)}`);
  lines.push("");
  lines.push("Per-case composite deltas (b minus a):");
  for (const r of cmp.perCase) {
    lines.push(
      `  ${r.caseId} [${r.category}]: ${r.aComposite.toFixed(2)} -> ${r.bComposite.toFixed(2)} (${fmt(r.delta)})`
    );
  }
  lines.push("");
  lines.push(`Improvements: ${cmp.improvements.length}`);
  for (const r of cmp.improvements) lines.push(`  ${r.caseId} (${fmt(r.delta)})`);
  lines.push(`Regressions: ${cmp.regressions.length}`);
  for (const r of cmp.regressions) lines.push(`  ${r.caseId} (${fmt(r.delta)})`);
  lines.push(`Content failures (keyword coverage below 0.5 for both): ${cmp.contentFailures.length}`);
  for (const r of cmp.contentFailures) lines.push(`  ${r.caseId}`);
  return lines.join("\n");
}

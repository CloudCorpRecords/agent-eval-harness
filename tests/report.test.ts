import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { compareExperiments, printComparison } from "../src/report.ts";
import { computeAggregate } from "../src/tracking.ts";
import type { CaseResult, Experiment } from "../src/types.ts";

function res(caseId: string, keyword: number, format: number): CaseResult {
  return {
    caseId,
    category: "test",
    output: "out",
    scores: { keyword, exact: null, format, composite: 0.5 * keyword + 0.5 * format },
  };
}

function exp(id: string, agent: string, results: CaseResult[]): Experiment {
  return {
    id,
    agent,
    label: "",
    params: {},
    startedAt: "2026-01-01T00:00:00.000Z",
    durationMs: 1,
    results,
    aggregate: computeAggregate(results),
  };
}

describe("compareExperiments", () => {
  it("computes deltas, regressions, improvements, and content failures", () => {
    const a = exp("a", "baseline", [res("win", 0.5, 0.5), res("loss", 1, 1), res("bad", 0, 0.5)]);
    const b = exp("b", "improved", [res("win", 1, 1), res("loss", 0, 1), res("bad", 0.2, 0.5)]);
    const cmp = compareExperiments(a, b);
    assert.equal(cmp.perCase.length, 3);
    const win = cmp.perCase.find((r) => r.caseId === "win")!;
    assert.equal(win.delta, 0.5); // 1.0 - 0.5
    assert.equal(cmp.improvements.length, 2); // "win" and "bad" (bad improves 0.25 -> 0.35)
    assert.deepEqual(
      cmp.improvements.map((r) => r.caseId).sort(),
      ["bad", "win"]
    );
    assert.equal(cmp.regressions.length, 1);
    assert.equal(cmp.regressions[0].caseId, "loss");
    // content failures: keyword below 0.5 for BOTH agents. "bad" still fails
    // even though it improved, which is exactly the honest-failure case we keep.
    assert.equal(cmp.contentFailures.length, 1);
    assert.equal(cmp.contentFailures[0].caseId, "bad");
    assert.ok(cmp.meanDelta > 0 === b.aggregate.meanComposite > a.aggregate.meanComposite);
  });

  it("ignores cases missing from one experiment", () => {
    const a = exp("a", "baseline", [res("only-a", 1, 1)]);
    const b = exp("b", "improved", [res("only-b", 1, 1)]);
    const cmp = compareExperiments(a, b);
    assert.equal(cmp.perCase.length, 0);
  });
});

describe("printComparison", () => {
  it("renders all sections as text", () => {
    const a = exp("a", "baseline", [res("x", 0, 1)]);
    const b = exp("b", "improved", [res("x", 1, 1)]);
    const text = printComparison(compareExperiments(a, b));
    assert.ok(text.includes("Mean composite delta"));
    assert.ok(text.includes("Improvements: 1"));
    assert.ok(text.includes("Regressions: 0"));
    assert.ok(text.includes("Content failures"));
  });
});

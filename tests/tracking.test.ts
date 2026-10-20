import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  computeAggregate,
  listExperiments,
  loadExperiment,
  saveExperiment,
} from "../src/tracking.ts";
import type { CaseResult, Experiment } from "../src/types.ts";

function makeResult(caseId: string, keyword: number, format: number, exact: number | null): CaseResult {
  return {
    caseId,
    category: "test",
    output: "out",
    scores: { keyword, exact, format, composite: 0.5 * keyword + 0.5 * format },
  };
}

function makeExperiment(id: string, startedAt: string): Experiment {
  const results = [makeResult("a", 1, 1, 1), makeResult("b", 0, 1, 0)];
  return {
    id,
    agent: "baseline",
    label: "",
    params: { agentVersion: "baseline-v1" },
    startedAt,
    durationMs: 5,
    results,
    aggregate: computeAggregate(results),
  };
}

describe("computeAggregate", () => {
  it("averages scores and handles null exacts", () => {
    const results = [
      makeResult("a", 1, 0.5, 1),
      makeResult("b", 0, 0.5, null),
      makeResult("c", 0.5, 1, 0),
    ];
    const agg = computeAggregate(results);
    assert.equal(agg.n, 3);
    assert.equal(agg.meanKeyword, 0.5);
    assert.equal(agg.meanFormat, 2 / 3);
    assert.equal(agg.meanExact, 0.5); // only the two applicable cases
    assert.equal(agg.meanComposite, (0.75 + 0.25 + 0.75) / 3);
  });
});

describe("save/load/list experiments", () => {
  it("round-trips experiments through a temp dir in time order", () => {
    const dir = mkdtempSync(join(tmpdir(), "eval-test-"));
    const e1 = makeExperiment("run-1", "2026-01-01T00:00:00.000Z");
    const e2 = makeExperiment("run-2", "2026-01-02T00:00:00.000Z");
    saveExperiment(e2, dir);
    saveExperiment(e1, dir);
    const listed = listExperiments(dir);
    assert.equal(listed.length, 2);
    assert.equal(listed[0].id, "run-1"); // sorted by startedAt, not write order
    assert.equal(listed[1].id, "run-2");
    const loaded = loadExperiment("run-1", dir);
    assert.ok(loaded);
    assert.equal(loaded.aggregate.n, 2);
    assert.equal(loadExperiment("nope", dir), null);
  });
  it("returns an empty list for a missing dir", () => {
    assert.deepEqual(listExperiments(join(tmpdir(), "eval-test-missing-" + Date.now())), []);
  });
});

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { exactScore, formatScore, keywordCoverage, normalize, scoreCase } from "../src/scorers.ts";
import type { EvalCase } from "../src/types.ts";

function makeCase(over: Partial<EvalCase>): EvalCase {
  return {
    id: "t",
    category: "test",
    question: "q",
    context: "ctx",
    expectedKeywords: [],
    requireCitations: false,
    outOfScope: false,
    ...over,
  };
}

describe("normalize", () => {
  it("lowercases and collapses whitespace", () => {
    assert.equal(normalize("  HeLLo,   World! "), "hello world");
  });
});

describe("keywordCoverage", () => {
  it("scores full coverage", () => {
    const c = makeCase({ expectedKeywords: ["30-day", "refund"] });
    assert.equal(keywordCoverage("a 30-day REFUND window", c), 1);
  });
  it("scores partial coverage", () => {
    const c = makeCase({ expectedKeywords: ["30-day", "refund", "monthly"] });
    assert.equal(keywordCoverage("a 30-day window", c), 1 / 3);
  });
  it("scores zero when nothing matches", () => {
    const c = makeCase({ expectedKeywords: ["slack"] });
    assert.equal(keywordCoverage("we use pagerduty", c), 0);
  });
  it("returns 1 when there are no expected keywords", () => {
    const c = makeCase({ expectedKeywords: [] });
    assert.equal(keywordCoverage("anything", c), 1);
  });
});

describe("exactScore", () => {
  it("matches exactly after normalization", () => {
    const c = makeCase({ expectedExact: "help@evalkit.dev" });
    assert.equal(exactScore("Contact: help@evalkit.dev.", c), 0);
    assert.equal(exactScore("help@evalkit.dev", c), 1);
  });
  it("returns null when no expectedExact is defined", () => {
    const c = makeCase({});
    assert.equal(exactScore("anything", c), null);
  });
});

describe("formatScore", () => {
  it("rewards refusal on out-of-scope cases", () => {
    const c = makeCase({ outOfScope: true });
    assert.equal(formatScore("I cannot answer from the available context.", c), 1);
    assert.equal(formatScore("The answer is blue.", c), 0);
  });
  it("rewards citations and conciseness for answered cases", () => {
    const c = makeCase({ requireCitations: true });
    assert.equal(formatScore("We offer 30-day refunds [1]", c), 1);
    assert.equal(formatScore("We offer 30-day refunds", c), 0.5);
    assert.equal(formatScore("x".repeat(300) + " [1]", c), 0.5);
  });
  it("auto-credits citations when not required", () => {
    const c = makeCase({ requireCitations: false });
    assert.equal(formatScore("short answer", c), 1);
    assert.equal(formatScore("x".repeat(300), c), 0.5);
  });
});

describe("scoreCase", () => {
  it("combines keyword and format with documented weights", () => {
    const c = makeCase({ expectedKeywords: ["a", "b"], requireCitations: false });
    const s = scoreCase("a", c);
    assert.equal(s.keyword, 0.5);
    assert.equal(s.format, 1);
    assert.equal(s.composite, 0.75);
    assert.equal(s.exact, null);
  });
});

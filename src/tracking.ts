// Experiment tracking in an MLflow-inspired local format.
// This is a JSON-file log written by this tool itself. It is not MLflow,
// it does not talk to Databricks, and it does not phone home.
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Aggregate, CaseResult, Experiment } from "./types.ts";

export function defaultRunsDir(): string {
  return join(process.cwd(), "runs");
}

export function makeRunId(agentName: string): string {
  const stamp = new Date()
    .toISOString()
    .replace(/[-:T]/g, "")
    .slice(0, 14); // YYYYMMDDHHMMSS
  const rand = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `run-${stamp}-${agentName}-${rand}`;
}

export function computeAggregate(results: CaseResult[]): Aggregate {
  const n = results.length;
  const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
  const exacts = results.map((r) => r.scores.exact).filter((x): x is number => x !== null);
  return {
    meanKeyword: mean(results.map((r) => r.scores.keyword)),
    meanFormat: mean(results.map((r) => r.scores.format)),
    meanExact: exacts.length ? mean(exacts) : null,
    meanComposite: mean(results.map((r) => r.scores.composite)),
    n,
  };
}

export function saveExperiment(exp: Experiment, runsDir: string = defaultRunsDir()): string {
  mkdirSync(runsDir, { recursive: true });
  const path = join(runsDir, exp.id + ".json");
  writeFileSync(path, JSON.stringify(exp, null, 2), "utf8");
  return path;
}

export function listExperiments(runsDir: string = defaultRunsDir()): Experiment[] {
  if (!existsSync(runsDir)) return [];
  const files = readdirSync(runsDir).filter((f) => f.endsWith(".json"));
  const exps: Experiment[] = files.map((f) =>
    JSON.parse(readFileSync(join(runsDir, f), "utf8")) as Experiment
  );
  exps.sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  return exps;
}

export function loadExperiment(id: string, runsDir: string = defaultRunsDir()): Experiment | null {
  const path = join(runsDir, id + ".json");
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf8")) as Experiment;
}

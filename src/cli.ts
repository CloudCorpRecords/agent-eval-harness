// CLI for the eval harness.
//   node src/cli.ts run --agent baseline|improved [--label "..."] [--runs-dir DIR]
//   node src/cli.ts runs [--runs-dir DIR]
//   node src/cli.ts compare [--a ID --b ID] [--runs-dir DIR]
import { AGENTS } from "./agents.ts";
import { DATASET } from "./dataset.ts";
import { scoreCase } from "./scorers.ts";
import {
  computeAggregate,
  defaultRunsDir,
  listExperiments,
  loadExperiment,
  makeRunId,
  saveExperiment,
} from "./tracking.ts";
import { compareExperiments, printComparison } from "./report.ts";
import type { CaseResult, Experiment } from "./types.ts";

function flag(args: string[], name: string): string | undefined {
  const i = args.indexOf(name);
  return i >= 0 && i + 1 < args.length ? args[i + 1] : undefined;
}

function cmdRun(args: string[]): void {
  const agentName = flag(args, "--agent");
  const agent = agentName ? AGENTS[agentName] : undefined;
  if (!agent) {
    console.error(`Unknown agent. Use --agent one of: ${Object.keys(AGENTS).join(", ")}`);
    process.exit(1);
  }
  const label = flag(args, "--label") ?? "";
  const runsDir = flag(args, "--runs-dir") ?? defaultRunsDir();
  const started = Date.now();
  const results: CaseResult[] = DATASET.map((c) => {
    const output = agent.answer(c);
    return { caseId: c.id, category: c.category, output, scores: scoreCase(output, c) };
  });
  const exp: Experiment = {
    id: makeRunId(agent.name),
    agent: agent.name,
    label,
    params: {
      agentVersion: agent.version,
      datasetCases: DATASET.length,
      keywordWeight: 0.5,
      formatWeight: 0.5,
    },
    startedAt: new Date(started).toISOString(),
    durationMs: Date.now() - started,
    results,
    aggregate: computeAggregate(results),
  };
  const path = saveExperiment(exp, runsDir);
  const a = exp.aggregate;
  console.log(`Saved ${exp.id} to ${path}`);
  console.log(
    `n=${a.n} meanKeyword=${a.meanKeyword.toFixed(3)} meanFormat=${a.meanFormat.toFixed(3)} ` +
      `meanExact=${a.meanExact === null ? "n/a" : a.meanExact.toFixed(3)} ` +
      `meanComposite=${a.meanComposite.toFixed(3)}`
  );
}

function cmdRuns(args: string[]): void {
  const runsDir = flag(args, "--runs-dir") ?? defaultRunsDir();
  const exps = listExperiments(runsDir);
  if (exps.length === 0) {
    console.log("No experiments logged yet. Run: node src/cli.ts run --agent baseline");
    return;
  }
  for (const e of exps) {
    console.log(
      `${e.id}  agent=${e.agent}  composite=${e.aggregate.meanComposite.toFixed(3)}  n=${e.aggregate.n}  ${e.startedAt}` +
        (e.label ? `  label="${e.label}"` : "")
    );
  }
}

function cmdCompare(args: string[]): void {
  const runsDir = flag(args, "--runs-dir") ?? defaultRunsDir();
  let a = flag(args, "--a");
  let b = flag(args, "--b");
  if (!a || !b) {
    const exps = listExperiments(runsDir);
    if (exps.length < 2) {
      console.error("Need at least two logged experiments to compare.");
      process.exit(1);
    }
    a = exps[exps.length - 2].id;
    b = exps[exps.length - 1].id;
  }
  const ea = loadExperiment(a, runsDir);
  const eb = loadExperiment(b, runsDir);
  if (!ea || !eb) {
    console.error("Could not load one of the experiments. Check the ids with: node src/cli.ts runs");
    process.exit(1);
  }
  console.log(printComparison(compareExperiments(ea, eb)));
}

const [cmd, ...rest] = process.argv.slice(2);
if (cmd === "run") cmdRun(rest);
else if (cmd === "runs") cmdRuns(rest);
else if (cmd === "compare") cmdCompare(rest);
else {
  console.error("Usage: node src/cli.ts run --agent baseline|improved | runs | compare");
  process.exit(1);
}

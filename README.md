# Eval Harness: deterministic agent evaluation with local experiment tracking

Independent prototype. Not affiliated with Databricks. All agents, data, and scores in this repo are simulated and run locally; there are no external calls, no API keys, and no connection to any Databricks service. The experiment log format is inspired by experiment tracking concepts (runs, params, per-case metrics); it is not MLflow and does not claim to be.

## What it is

A zero-dependency TypeScript/Node tool that answers one practical question: did my agent change actually make things better, or just different? It runs a fixed 14-case eval suite against two built-in mock agents, scores every answer with transparent rules, logs each run as an experiment (params, per-case outputs, aggregate metrics), and prints a comparison report that shows wins, regressions, and shared failures.

## The mock agents

- **baseline** (baseline-v1): naive first-sentence extraction from the context. Never refuses, never cites. The "zero instruction tuning" stand-in.
- **improved** (improved-v1): four hand-written rules on top of baseline: a scope classifier that refuses out-of-scope questions, exact-answer extraction for "what is the exact ..." questions, two-sentence answers for how-to questions, and citations plus a 280-character cap for grounded answers.

Both are deterministic rule systems, not language models. They exist to make the harness itself the star: scoring, tracking, and comparison.

## How scoring works

Documented in `src/scorers.ts`, reproducible by hand:

- **keyword coverage** (weight 0.5): fraction of the case's expected keywords present in the output, case-insensitive.
- **format** (weight 0.5): for out-of-scope cases, 1.0 only if the output is a refusal; for answered cases, 0.5 for a citation marker like `[1]` when citations are required, plus 0.5 for staying within 280 characters.
- **exact**: 1.0 when the normalized output equals the expected answer exactly, 0 otherwise; reported only for the two cases that define an expected answer.
- **composite**: 0.5 * keyword + 0.5 * format.

## Run it (under 2 minutes, no install)

```bash
cd builds/databricks
node src/cli.ts run --agent baseline
node src/cli.ts run --agent improved
node src/cli.ts runs      # list logged experiments
node src/cli.ts compare   # compare the two most recent runs
npm test                  # the test suite
```

Runs are logged as JSON files under `runs/` (gitignored), each holding the agent version, params, every per-case output with its scores, and the aggregate.

## Real headline results (actual run, 2026-10-19)

| | baseline | improved |
|---|---|---|
| mean composite | 0.536 | 0.750 |
| mean keyword | 0.500 | 0.500 |
| mean format | 0.571 | 1.000 |
| mean exact | 0.000 | 1.000 |

Composite delta: **+0.21** for the improved agent. 8 cases improved, 1 regressed, 5 tied.

The failure the report keeps on purpose: **cooling-off** regressed from 1.00 to 0.50. The scope classifier refused a legitimate refund question because the user said "cooling-off period" instead of "refund". This is the classic brittle-classifier failure, and it is exactly the kind of thing an eval suite is supposed to catch before a "helpful" change ships.

Cases where both agents still fail (keyword coverage below 0.5 for both): **pro-seats-math** (multi-hop arithmetic, 12 seats on Pro needs 10 included plus 2 at $12, neither agent does math), **slack-alerts** (synonym gap, the docs say PagerDuty not Slack), **late-refund** (single-sentence extraction grabs the wrong sentence), plus the three refusal cases where keyword coverage is 0 by design because a correct refusal contains no answer keywords. Those are reported as content failures, not hidden.

## How this maps to applied AI evaluation work in production

1. **Fixed suites beat vibes.** The same 14 cases run against every agent version, so a prompt change cannot hide behind a new test set.
2. **Refusal behavior is scored, not assumed.** Out-of-scope handling has its own metric, because a support agent that hallucinates is worse than one that abstains.
3. **Regressions are first-class output.** The comparison prints every case that got worse, so a change with a better mean still has to answer for what it broke.
4. **Failure taxonomy drives the roadmap.** Each shared failure maps to a concrete next technique: math needs tool use, synonyms need retrieval, wrong-sentence extraction needs ranking.

## Test report

`npm test` (node --test, no install needed): **17 tests, 17 pass, 0 fail**. Coverage: scorer rules (normalization, keyword partial credit, exact match and its null case, refusal and citation and length format checks, composite weights), experiment logging (round-trip through a temp dir, time-ordered listing, aggregate math with null exacts), and comparison logic (deltas, regression and improvement detection, content-failure detection, missing-case handling).

## Files

- `src/types.ts` shared types
- `src/dataset.ts` the 14-case synthetic dataset
- `src/agents.ts` the two mock agents
- `src/scorers.ts` the scoring rules
- `src/tracking.ts` experiment logging (local JSON, MLflow-inspired format)
- `src/report.ts` comparison logic and report printing
- `src/cli.ts` the CLI
- `tests/` the test suite
- `WALKTHROUGH.md` interview talking points

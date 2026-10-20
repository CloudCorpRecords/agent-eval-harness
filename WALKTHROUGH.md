# Walkthrough: eval harness with experiment tracking

Five bullets Rene can present from, then likely follow-ups with honest answers.

## The 5 bullets

1. **The problem it solves.** Every agent team eventually asks "did our change help or just move the numbers around?" This is a small, working answer: a fixed 14-case suite, transparent scorers, and a run log, so every agent version is judged on the same ground.
2. **What it does.** Two simulated agents run the same suite. Each run is logged as an experiment with params, every per-case output, and aggregate metrics. The comparison prints the mean delta plus every regression and every shared failure. Nothing is averaged away.
3. **The honest result.** Improved beats baseline by +0.21 composite, mainly on format (citations, conciseness) and exact answers. But it regresses on one real case: the scope classifier refuses a valid refund question phrased as "cooling-off period". The report keeps that failure front and center.
4. **What the failures teach.** The shared failures map to real techniques: multi-hop math needs tool use, the Slack/PagerDuty synonym gap needs retrieval, wrong-sentence extraction needs ranking. That is the actual roadmap conversation an applied AI engineer has.
5. **Why the engineering matters.** Deterministic, zero dependencies, tests for the scorers and the comparison logic, and every number reproducible by hand from the rules in the source. Eval infrastructure has to be trustworthy before the evals are.

## Likely follow-ups

**"Why mock agents instead of real LLMs?"**
Because the deliverable here is the harness, not the agents. Mock agents are deterministic, so a score change always means the code changed, never the model mood. In production you would plug the same harness into real model endpoints and the scoring, logging, and comparison code would not change.

**"Is this MLflow?"**
No. The log format is inspired by experiment tracking concepts, runs with params and per-case metrics stored as local JSON. It does not use MLflow or touch Databricks. The honest line is in the README.

**"Why is keyword coverage the same for both agents (0.500)?"**
Because the improved rules mostly changed formatting, refusal, and exact extraction, not content recall. The comparison makes that visible: same substance, better presentation and abstention. In a real iteration loop that flat line is the signal to work on retrieval next.

**"What would you build next?"**
Retrieval over the context instead of first-sentence extraction, a tool-call stub for the math case, and a second dataset of adversarial phrasings to harden the scope classifier. Each would be a new experiment row in the same log, compared the same way.

**"Did you test it?"**
17 tests, all passing, covering the scorers, the logging round-trip, and the comparison logic. The run command and test command are both in the README with real numbers from an actual run.

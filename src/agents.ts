// Two simulated, deterministic mock agents. No network, no LLM calls, no randomness.
// The "improved" agent is a small set of hand-written rules on top of the baseline.
// Its failure modes are real and kept in the report on purpose.
import type { EvalCase } from "./types.ts";

export interface MockAgent {
  name: string;
  version: string;
  answer(c: EvalCase): string;
}

export function firstSentence(text: string): string {
  const m = text.match(/^.*?[.!?](?=\s|$)/s);
  return (m ? m[0] : text).trim();
}

export function firstTwoSentences(text: string): string {
  const parts = text.split(/(?<=[.!?])\s+/);
  return parts.slice(0, 2).join(" ").trim();
}

// The baseline: naive extractive answer. Always returns the first sentence of the
// context, never refuses, never cites. This is the "prompt a base model with zero
// instruction tuning" stand-in.
export const baselineAgent: MockAgent = {
  name: "baseline",
  version: "baseline-v1",
  answer(c: EvalCase): string {
    return firstSentence(c.context);
  },
};

// Topics the improved agent's scope classifier recognizes. Anything outside this
// list gets a refusal. Deliberately brittle: the "cooling-off" case shows what
// happens when a user phrases an in-scope question with out-of-list words.
const SCOPE_KEYWORDS = [
  "refund",
  "billing",
  "price",
  "pricing",
  "install",
  "setup",
  "sdk",
  "api key",
  "webhook",
  "quota",
  "rate limit",
  "error",
  "alert",
  "payment",
  "support",
  "seat",
  "plan",
];

const REFUSAL = "I cannot answer from the available context.";

export const improvedAgent: MockAgent = {
  name: "improved",
  version: "improved-v1",
  answer(c: EvalCase): string {
    const q = c.question.toLowerCase().trim();

    // Rule 1: scope classification. Refuse anything outside known topics.
    if (!SCOPE_KEYWORDS.some((k) => q.includes(k))) {
      return REFUSAL;
    }

    let text: string;

    // Rule 2: exact-answer extraction for "what is the exact ..." questions.
    if (/^what is the exact/i.test(c.question.trim())) {
      const email = c.context.match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/);
      if (email) return email[0];
      const duration = c.context.match(/\d+-day/i);
      if (duration) return duration[0];
      text = firstSentence(c.context);
    } else if (/how do i|install|set up|enable|rotate/i.test(c.question)) {
      // Rule 3: how-to questions get the first two sentences (setup steps
      // usually span more than one sentence).
      text = firstTwoSentences(c.context);
    } else {
      text = firstSentence(c.context);
    }

    // Rule 4: citations and conciseness for grounded answers.
    if (c.requireCitations) {
      const maxContent = 274; // leave room for " [1]"
      if (text.length > maxContent) {
        const cut = text.lastIndexOf(" ", maxContent);
        text = (cut > 0 ? text.slice(0, cut) : text.slice(0, maxContent)).trim();
      }
      text = text + " [1]";
    } else if (text.length > 280) {
      const cut = text.lastIndexOf(" ", 280);
      text = (cut > 0 ? text.slice(0, cut) : text.slice(0, 280)).trim();
    }
    return text;
  },
};

export const AGENTS: Record<string, MockAgent> = {
  baseline: baselineAgent,
  improved: improvedAgent,
};

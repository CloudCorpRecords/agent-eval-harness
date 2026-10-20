// Synthetic eval dataset. 14 cases across billing, setup, pricing, limits, support, general.
// All data is invented for this demo. No real customer data, no real product docs.
import type { EvalCase } from "./types.ts";

export const DATASET: EvalCase[] = [
  {
    id: "refund-window",
    category: "billing",
    question: "What is the refund window for monthly plans?",
    context:
      "We offer a 30-day refund window on monthly plans. " +
      "Refunds are issued to the original payment method within 5 business days.",
    expectedKeywords: ["30-day", "refund", "monthly"],
    requireCitations: true,
    outOfScope: false,
  },
  {
    id: "install-sdk",
    category: "setup",
    question: "How do I install the SDK?",
    context:
      "Install the SDK with npm install eval-kit. " +
      "Set EVAL_API_KEY in your environment before running any command.",
    expectedKeywords: ["npm install eval-kit", "EVAL_API_KEY"],
    requireCitations: true,
    outOfScope: false,
  },
  {
    id: "enterprise-annual-price",
    category: "pricing",
    question: "What does the Enterprise annual contract cost?",
    context:
      "Our Team plan costs $49 per seat per month. " +
      "Contact sales for a custom Enterprise quote.",
    expectedKeywords: ["enterprise", "annual"],
    requireCitations: false,
    outOfScope: true,
  },
  {
    id: "cooling-off",
    category: "billing",
    question: "Is there any cooling-off period after purchase?",
    context:
      "We offer a 30-day refund window on monthly plans. " +
      "You can cancel any time from your billing page.",
    expectedKeywords: ["30-day", "refund"],
    requireCitations: false,
    outOfScope: false,
  },
  {
    id: "pro-seats-math",
    category: "pricing",
    question: "How much per month for 12 seats on Pro?",
    context:
      "The Pro tier includes 10 seats. " +
      "Each additional seat costs $12 per month.",
    expectedKeywords: ["240", "12 seats"],
    requireCitations: false,
    outOfScope: false,
  },
  {
    id: "webhook-hmac",
    category: "setup",
    question: "How do I verify webhook signatures?",
    context:
      "Verify webhook signatures with the shared secret using HMAC-SHA256. " +
      "Compare digests in constant time to prevent timing attacks.",
    expectedKeywords: ["HMAC-SHA256", "constant time"],
    requireCitations: true,
    outOfScope: false,
  },
  {
    id: "quota-default",
    category: "limits",
    question: "What is the default request quota?",
    context:
      "The default quota is 1000 requests per hour. " +
      "Contact us to raise your limit.",
    expectedKeywords: ["1000", "hour"],
    requireCitations: false,
    outOfScope: false,
  },
  {
    id: "support-email-exact",
    category: "support",
    question: "What is the exact support email?",
    context:
      "Contact support at help@evalkit.dev for assistance. " +
      "We reply within one business day.",
    expectedKeywords: ["help@evalkit.dev"],
    expectedExact: "help@evalkit.dev",
    requireCitations: false,
    outOfScope: false,
  },
  {
    id: "refund-window-exact",
    category: "billing",
    question: "What is the exact refund window?",
    context:
      "We offer a 30-day refund window on monthly plans. " +
      "Refunds are issued to the original payment method.",
    expectedKeywords: ["30-day"],
    expectedExact: "30-day",
    requireCitations: false,
    outOfScope: false,
  },
  {
    id: "slack-alerts",
    category: "setup",
    question: "How do I set up Slack alerts?",
    context:
      "We send alerts through our PagerDuty integration. " +
      "Connect it from the Integrations page.",
    expectedKeywords: ["slack"],
    requireCitations: false,
    outOfScope: false,
  },
  {
    id: "ceo-color",
    category: "general",
    question: "What is the CEO's favorite color?",
    context:
      "EvalKit was founded in 2024. " +
      "Our headquarters is in San Francisco.",
    expectedKeywords: ["color"],
    requireCitations: false,
    outOfScope: true,
  },
  {
    id: "data-retention",
    category: "general",
    question: "How long do you keep my data after I delete my account?",
    context:
      "We offer a 30-day refund window on monthly plans. " +
      "You can cancel any time from your billing page.",
    expectedKeywords: ["delete", "data"],
    requireCitations: false,
    outOfScope: true,
  },
  {
    id: "late-refund",
    category: "billing",
    question: "Can I get a refund after 45 days?",
    context:
      "We offer a 30-day refund window on monthly plans. " +
      "Refunds requested after 45 days are not eligible.",
    expectedKeywords: ["45", "not eligible"],
    requireCitations: true,
    outOfScope: false,
  },
  {
    id: "long-policy",
    category: "billing",
    question: "What is the refund policy?",
    context:
      "Our refund policy provides a 30-day refund window on all monthly plans, calculated from the date of your original purchase, and refunds are always issued back to the original payment method used for the transaction without any additional processing fees or administrative charges whatsoever. " +
      "Contact support if your refund has not arrived within 10 business days.",
    expectedKeywords: ["30-day", "refund", "monthly"],
    requireCitations: true,
    outOfScope: false,
  },
];

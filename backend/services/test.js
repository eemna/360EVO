import { calculateMatchScore } from "./matchingEngine.js";

function displayScores(label, { matchScore, categoryScores }) {
  const maxes = { industry: 25, stage: 20, technology: 20, funding: 15, geography: 10 };

  console.log(`\n${label}`);
  console.log(`── Match Score: ${matchScore}/100 ${"─".repeat(30)}`);

  for (const [key, score] of Object.entries(categoryScores)) {
    const max = maxes[key];
    if (!max) {
      console.log(`  ${key.padEnd(14)} +${score} pts (bonus)`);
      continue;
    }
    const pct = Math.round((score / max) * 100);
    const filled = Math.round(pct / 10);
    const bar = "█".repeat(filled) + "░".repeat(10 - filled);
    console.log(`  ${key.padEnd(14)} ${String(score).padStart(2)}/${max} pts  [${bar}] ${pct}%`);
  }
}

// ── Test 1:
const investor = {
  industries: ["Fintech"], // lowercase t
  stages: ["MVP"],
  technologies: ["Artificial Intelligence"], // long form
  geographicPrefs: ["United States"],
  fundingMin: 100000,
  fundingMax: 500000,
  investmentThesis:
    "We invest in early stage fintech startups using AI to disrupt banking",
};

const project = {
  industry: "FinTech", // capital T
  stage: "MVP",
  technologies: ["AI"], // short form
  location: "USA", // different from "United States"
  fundingSought: 300000,
  fullDesc: "AI-powered payment platform for emerging markets",
};

const assessment = { irScore: 75, trlScore: 6 };
const result = await calculateMatchScore(investor, project, assessment);
console.log("Test 1 - Should score HIGH (70+):");
displayScores("Test 1 — Should score HIGH (70+):", result);

// ── Test 2
const investorB = {
  industries: ["CleanTech"],
  stages: ["SCALING"],
  technologies: ["Solar Energy"],
  geographicPrefs: ["Germany"],
  fundingMin: 5000000,
  fundingMax: 20000000,
  investmentThesis:
    "We invest in clean energy and sustainability projects in Europe",
};

const projectB = {
  industry: "FinTech",
  stage: "IDEA",
  technologies: ["Blockchain"],
  location: "Brazil",
  fundingSought: 50000,
  fullDesc: "Crypto wallet for unbanked populations",
};

const assessmentB = { irScore: 30, trlScore: 2 };

const resultB = await calculateMatchScore(investorB, projectB, assessmentB);
console.log("\nTest 2 - Should score LOW (under 25):");
console.log("Score:", resultB.matchScore);
console.log("Categories:", resultB.categoryScores);

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const fuzz = require("fuzzball");
console.log("\nTest 3 - Fuzzy matching sanity check:");
console.log(
  "'Fintech' vs 'FinTech':",
  fuzz.token_sort_ratio("fintech", "fintech"),
  "/ 100",
);
console.log(
  "'AI' vs 'Artificial Intelligence':",
  fuzz.token_sort_ratio("ai", "artificial intelligence"),
  "/ 100",
);
console.log(
  "'USA' vs 'United States':",
  fuzz.token_sort_ratio("usa", "united states"),
  "/ 100",
);


import { calculateMatchScore } from "./matchingEngine.js";

// ── Test 1:
const investor = {
  industries: ["Fintech"],          // lowercase t
  stages: ["MVP"],
  technologies: ["Artificial Intelligence"],  // long form
  geographicPrefs: ["United States"],
  fundingMin: 100000,
  fundingMax: 500000,
  investmentThesis: "We invest in early stage fintech startups using AI to disrupt banking",
};

const project = {
  industry: "FinTech",              // capital T
  stage: "MVP",
  technologies: ["AI"],             // short form 
  location: "USA",                  // different from "United States"
  fundingSought: 300000,
  fullDesc: "AI-powered payment platform for emerging markets",
};

const assessment = { irScore: 75, trlScore: 6 };

const result = await calculateMatchScore(investor, project, assessment);
console.log("Test 1 - Should score HIGH (70+):");
console.log("Score:", result.matchScore);
console.log("Categories:", result.categoryScores);

// ── Test 2
const investorB = {
  industries: ["CleanTech"],
  stages: ["SCALING"],
  technologies: ["Solar Energy"],
  geographicPrefs: ["Germany"],
  fundingMin: 5000000,
  fundingMax: 20000000,
  investmentThesis: "We invest in clean energy and sustainability projects in Europe",
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

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const fuzz = require('fuzzball');
console.log("\nTest 3 - Fuzzy matching sanity check:");
console.log("'Fintech' vs 'FinTech':", fuzz.token_sort_ratio("fintech", "fintech"), "/ 100");
console.log("'AI' vs 'Artificial Intelligence':", fuzz.token_sort_ratio("ai", "artificial intelligence"), "/ 100");
console.log("'USA' vs 'United States':", fuzz.token_sort_ratio("usa", "united states"), "/ 100");
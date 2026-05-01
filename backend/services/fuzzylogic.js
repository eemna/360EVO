import { createRequire } from "module";
const require = createRequire(import.meta.url);
const fuzz = require("fuzzball");

const ABBREV_MAP = {
  ai: "artificial intelligence",
  ml: "machine learning",
  iot: "internet of things",
  usa: "united states",
  us: "united states",
  uk: "united kingdom",
  uae: "united arab emirates",
  saas: "software as a service",
  b2b: "business to business",
  b2c: "business to consumer",
};

function normalize(str) {
  const lower = str.toLowerCase().trim();
  return ABBREV_MAP[lower] || lower;
}

function fuzzyMatch(a, b) {
  if (!a || !b) return 0;
  const normA = normalize(a);
  const normB = normalize(b);

  if (normA.startsWith(normB) || normB.startsWith(normA)) return 0.9;

  return fuzz.token_sort_ratio(normA, normB) / 100;
}

export function triangular(x, a, b, c) {
  if (x <= a || x >= c) return 0;
  if (x <= b) return (x - a) / (b - a);
  return (c - x) / (c - b);
}

export function trapezoidal(x, a, b, c, d) {
  if (x <= a || x >= d) return 0;
  if (x >= b && x <= c) return 1;
  if (x < b) return (x - a) / (b - a);
  return (d - x) / (d - c);
}

export function sigmoid(x, x0, k = 10) {
  return 1 / (1 + Math.exp(-k * (x - x0)));
}

const STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "but",
  "in",
  "on",
  "at",
  "to",
  "for",
  "of",
  "with",
  "by",
  "from",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "will",
  "would",
  "could",
  "should",
  "may",
  "might",
  "i",
  "we",
  "you",
  "they",
  "it",
  "this",
  "that",
  "these",
  "those",
  "my",
  "our",
  "your",
  "their",
  "its",
  "not",
  "no",
  "so",
  "if",
  "as",
  "up",
  "out",
  "about",
  "also",
  "just",
  "more",
  "some",
  "any",
  "all",
  "each",
  "very",
  "can",
  "use",
  "focus",
  "invest",
  "look",
  "seek",
  "using",
  "through",
  "across",
]);

function tokenize(text) {
  if (!text) return [];

  const expanded = expandAbbreviations(text);

  return expanded
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
}

function tfVector(tokens) {
  const tf = {};
  if (!tokens.length) return tf;
  for (const t of tokens) tf[t] = (tf[t] || 0) + 1;
  for (const w in tf) tf[w] /= tokens.length;
  return tf;
}

function cosine(a, b) {
  let dot = 0,
    magA = 0,
    magB = 0;
  for (const w in a) {
    magA += a[w] ** 2;
    if (b[w]) dot += a[w] * b[w];
  }
  for (const w in b) magB += b[w] ** 2;
  if (!magA || !magB) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

function expandAbbreviations(text) {
  if (!text) return "";
  let result = text.toLowerCase();
  for (const [abbrev, full] of Object.entries(ABBREV_MAP)) {
    result = result.replace(new RegExp(`\\b${abbrev}\\b`, "g"), full);
  }
  return result;
}

export function textSimilarity(textA, textB) {
  const normA = expandAbbreviations(textA);
  const normB = expandAbbreviations(textB);
  return cosine(tfVector(tokenize(normA)), tfVector(tokenize(normB)));
}

const INDUSTRY_GROUPS = [
  ["FinTech", "Blockchain & Crypto", "E-Commerce"],
  ["HealthTech", "AI & Machine Learning", "IoT"],
  ["EdTech", "SaaS", "AI & Machine Learning"],
  ["CleanTech", "AgriTech", "IoT"],
  ["PropTech", "SaaS", "E-Commerce"],
  ["Cybersecurity", "AI & Machine Learning", "SaaS"],
];

const STAGE_ORDER = ["IDEA", "PROTOTYPE", "MVP", "GROWTH", "SCALING"];

export function fuzzifyIndustry(investorIndustries, projectIndustry) {
  if (!investorIndustries || investorIndustries.length === 0)
    return { low: 0.0, medium: 0.6, high: 0.0 };
  const bestSim = Math.max(
    ...investorIndustries.map((i) => fuzzyMatch(i, projectIndustry)),
  );

  if (bestSim >= 0.85) return { low: 0.0, medium: 0.0, high: 1.0 };
  if (bestSim >= 0.6) return { low: 0.0, medium: 0.8, high: 0.2 };

  for (const group of INDUSTRY_GROUPS) {
    if (
      group.includes(projectIndustry) &&
      investorIndustries.some((i) => group.includes(i))
    )
      return { low: 0.0, medium: 1.0, high: 0.0 };
  }
  return { low: 1.0, medium: 0.0, high: 0.0 };
}

export function fuzzifyStage(investorStages, projectStage) {
  if (!investorStages || investorStages.length === 0)
    return { low: 0.0, medium: 0.5, high: 0.0 };
  const projectIdx = STAGE_ORDER.indexOf(projectStage);
  if (projectIdx === -1) return { low: 0.5, medium: 0.0, high: 0.0 };
  const minDist = Math.min(
    ...investorStages.map((s) => {
      const i = STAGE_ORDER.indexOf(s);
      return i === -1 ? 99 : Math.abs(projectIdx - i);
    }),
  );
  return {
    high: triangular(minDist, -0.5, 0, 0.5),
    medium: triangular(minDist, 0, 1, 2),
    low: trapezoidal(minDist, 1.5, 2.5, 99, 99),
  };
}

export function fuzzifyFunding(investorProfile, project) {
  const hasMin =
    investorProfile.fundingMin != null && investorProfile.fundingMin !== "";
  const hasMax =
    investorProfile.fundingMax != null && investorProfile.fundingMax !== "";
  if (!hasMin && !hasMax) return { low: 0.0, medium: 0.5, high: 0.0 };
  if (!project.fundingSought) return { low: 0.0, medium: 0.3, high: 0.0 };
  const F = Number(project.fundingSought);
  const min = hasMin ? Number(investorProfile.fundingMin) : 0;
  const max = hasMax ? Number(investorProfile.fundingMax) : F * 10;
  const tol = (max - min) * 0.5 || max * 0.5;
  return {
    high: trapezoidal(F, min - tol, min, max, max + tol),
    medium: trapezoidal(F, min - tol * 2, min - tol, max + tol, max + tol * 2),
    low: F < min - tol * 2 || F > max + tol * 2 ? 1.0 : 0.0,
  };
}

export function fuzzifyTechnology(investorTechs, projectTechs, projectDesc) {
  if (!investorTechs || investorTechs.length === 0)
    return { low: 0.0, medium: 0.5, high: 0.0, _overlapRatio: 0, _nlpSim: 0 };

  const overlap =
    projectTechs?.filter((pt) =>
      investorTechs.some((it) => fuzzyMatch(it, pt) >= 0.82),
    ).length || 0;
  const overlapRatio = overlap / investorTechs.length;
  const nlpSim = textSimilarity(
    investorTechs.join(" "),
    [...(projectTechs || []), projectDesc || ""].join(" "),
  );

  const signal = Math.min(1, Math.max(overlapRatio, nlpSim * 1.5));
  return {
    high: sigmoid(signal, 0.6, 8),
    medium: triangular(signal, 0.1, 0.4, 0.8),
    low: 1 - sigmoid(signal, 0.2, 8),
    _overlapRatio: overlapRatio,
    _nlpSim: nlpSim,
  };
}

export function fuzzifyThesis(investmentThesis, projectFullDesc) {
  if (!investmentThesis || investmentThesis.trim().length < 20)
    return { low: 0.0, medium: 0.5, high: 0.0, _rawSimilarity: 0 };
  if (!projectFullDesc || projectFullDesc.trim().length < 20)
    return { low: 0.0, medium: 0.3, high: 0.0, _rawSimilarity: 0 };

  const cosineSim = textSimilarity(investmentThesis, projectFullDesc);
  const thesisTokens = tokenize(expandAbbreviations(investmentThesis));
  const descTokens = new Set(tokenize(expandAbbreviations(projectFullDesc)));
  const hits = thesisTokens.filter((t) => descTokens.has(t)).length;
  const keywordRatio = thesisTokens.length > 0 ? hits / thesisTokens.length : 0;
  const sim = Math.min(1, cosineSim * 0.4 + keywordRatio * 0.6);

  return {
    high: sigmoid(sim, 0.35, 15),
    medium: triangular(sim, 0.1, 0.25, 0.5),
    low: 1 - sigmoid(sim, 0.15, 15),
    _rawSimilarity: Math.round(sim * 1000) / 1000,
  };
}

export function fuzzifyGeography(investorProfile, project) {
  const prefs = investorProfile.geographicPrefs;
  if (!prefs || prefs.length === 0) return { low: 0.0, medium: 0.5, high: 0.0 };
  const loc = project.location?.toLowerCase() || "";
  if (!loc) return { low: 0.0, medium: 0.3, high: 0.0 };
  if (prefs.some((p) => p.toLowerCase() === "global"))
    return { low: 0.0, medium: 0.0, high: 1.0 };
  const exactMatch = prefs.some((p) => fuzzyMatch(p, loc) >= 0.8);
  const nlpSim = textSimilarity(prefs.join(" "), loc);
  if (exactMatch) return { low: 0.0, medium: 0.0, high: 1.0 };
  if (nlpSim > 0.3) return { low: 0.0, medium: 1.0, high: 0.0 };
  return { low: 1.0, medium: 0.0, high: 0.0 };
}

// STEP 2 — PER-CATEGORY INFERENCE

// Industry inference

export function inferIndustry(raw, { thesisSim }) {
  const thesisHigh = sigmoid(thesisSim, 0.35, 15);
  const thesisLow = 1 - sigmoid(thesisSim, 0.15, 15);

  let outHigh = raw.high;
  let outMedium = raw.medium;
  let outLow = raw.low;

  const r2 = Math.min(raw.medium, thesisHigh);
  outHigh = Math.max(outHigh, r2);
  outMedium = Math.max(0, outMedium - r2);

  const r3 = Math.min(raw.medium, thesisLow);
  outLow = Math.max(outLow, r3);

  return { low: outLow, medium: outMedium, high: outHigh };
}

/**
 * Stage inference

 * Rules:
 *   R1: IF raw=high                             output.high = raw.high
 *   R2: IF raw=medium AND irScore=high          output.high  = min(medium, irHigh)
 *   R3: IF raw=medium AND irScore=low           output.low  += min(medium, irLow) * 0.5
 *   R4: IF raw=low                              output.low  = raw.low
 */
export function inferStage(raw, { irScore }) {
  const irNorm = irScore / 100;
  const irHigh = sigmoid(irNorm, 0.7, 10);
  const irLow = 1 - sigmoid(irNorm, 0.4, 10);

  let outHigh = raw.high;
  let outMedium = raw.medium;
  let outLow = raw.low;

  const r2 = Math.min(raw.medium, irHigh);
  outHigh = Math.max(outHigh, r2);
  outMedium = Math.max(0, outMedium - r2);

  const r3 = Math.min(raw.medium, irLow) * 0.5;
  outLow = Math.max(outLow, r3);

  return { low: outLow, medium: outMedium, high: outHigh };
}

/**
 * Technology inference

 * Rules:
 *   R1: IF overlapRatio=high                     output.high (exact match is strong)
 *   R2: IF overlapRatio=low AND nlpSim=high     output.medium
 *       (semantic match without exact tag — partial credit, not full)
 *   R3: IF overlapRatio=high AND nlpSim=high    output.high boosted
 *       (both signals agree → more confident)
 *   R4: IF overlapRatio=low AND nlpSim=low      output.low
 */
export function inferTechnology(raw, { overlapRatio, nlpSim }) {
  const exactHigh = sigmoid(overlapRatio, 0.5, 10);
  const exactLow = 1 - sigmoid(overlapRatio, 0.2, 10);
  const nlpHigh = sigmoid(nlpSim, 0.25, 12);
  const nlpLow = 1 - sigmoid(nlpSim, 0.1, 12);

  let outHigh = exactHigh;

  const r2 = Math.min(exactLow, nlpHigh);
  let outMedium = Math.max(raw.medium, r2);

  const r3 = Math.min(exactHigh, nlpHigh) * 0.3;
  outHigh = Math.min(1, outHigh + r3);

  let outLow = Math.min(raw.low, Math.min(exactLow, nlpLow));

  return { low: outLow, medium: outMedium, high: outHigh };
}

/**
 * Funding inference

 * Rules:
 *   R1: IF raw=high                             output.high = raw.high
 *   R2: IF raw=medium AND irScore=high           output.high  = min(medium, irHigh) * 0.6
 *       (close to range + strong project  partial promotion, not full)
 *   R3: IF raw=low AND irScore=high             output.medium = min(low, irHigh) * 0.3
 *       (outside range but exceptional project    tiny rescue)
 *   R4: IF raw=low AND irScore=low               output.low reinforced
 */
export function inferFunding(raw, { irScore }) {
  const irNorm = irScore / 100;
  const irHigh = sigmoid(irNorm, 0.7, 10);

  let outHigh = raw.high;
  let outMedium = raw.medium;
  let outLow = raw.low;

  const r2 = Math.min(raw.medium, irHigh) * 0.6;
  outHigh = Math.max(outHigh, r2);

  const r3 = Math.min(raw.low, irHigh) * 0.3;
  outMedium = Math.max(outMedium, r3);
  outLow = Math.max(0, outLow - r3);

  return { low: outLow, medium: outMedium, high: outHigh };
}

/**
 * Geography inference

 * Rules:
 *   R1: IF raw=high                              output.high = raw.high
 *   R2: IF raw=medium AND projectIsGlobal        output.high = medium * 0.7
 *   R3: IF raw=low                               output.low  = raw.low
 */
export function inferGeography(raw, { projectLocation }) {
  const isGlobal = projectLocation?.toLowerCase().includes("global");

  let outHigh = raw.high;
  let outMedium = raw.medium;
  let outLow = raw.low;

  if (isGlobal) {
    const r2 = raw.medium * 0.7;
    outHigh = Math.max(outHigh, r2);
    outMedium = Math.max(0, outMedium - r2);
  }

  return { low: outLow, medium: outMedium, high: outHigh };
}

/**
 * Thesis inference

 * Rules:
 *   R1: IF raw=high                              output.high = raw.high
 *   R2: IF raw=high AND industryMatch=exact      output.high boosted * 1.1 
 *   R3: IF raw=medium AND industryMatch=none     output.medium reduced * 0.7
 *       (thesis says yes but industry says no     less trustworthy signal)
 *   R4: IF raw=low                               output.low = raw.low
 */
export function inferThesis(raw, { industryHigh }) {
  let outHigh = raw.high;
  let outMedium = raw.medium;
  let outLow = raw.low;

  const r2 = Math.min(raw.high, industryHigh) * 0.1;
  outHigh = Math.min(1, outHigh + r2);

  const industryLow = 1 - industryHigh;
  outMedium = outMedium * (1 - industryLow * 0.3);

  return { low: outLow, medium: outMedium, high: outHigh };
}

// STEP 3 — PER-CATEGORY DEFUZZIFICATION

const CENTROIDS = { low: 0.15, medium: 0.5, high: 0.95 };

export function defuzzifyCategory(output, maxPts) {
  let numerator = 0;
  let denominator = 0;
  for (const set of ["low", "medium", "high"]) {
    const mu = output[set] || 0;
    const centroid = CENTROIDS[set] * maxPts;
    numerator += mu * centroid;
    denominator += mu;
  }
  if (denominator === 0) return maxPts * CENTROIDS.medium;
  return Math.max(0, Math.min(maxPts, numerator / denominator));
}

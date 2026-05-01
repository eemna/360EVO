import { calculateMatchScore } from "../services/matchingEngine.js";

const investorProfile = {
  industries: ["EdTech", "HealthTech"],
  stages: ["PROTOTYPE", "MVP"],
  technologies: ["AI", "Blockchain", "Cloud"],
  fundingMin: 10000,
  fundingMax: 500000,
  geographicPrefs: ["Africa", "Tunisia"],
  mustHaves: {},
  exclusions: {},
};

const project = {
  industry: "EdTech",
  stage: "PROTOTYPE",
  technologies: ["AI", "Blockchain"],
  fundingSought: 100000,
  location: "Tunis, Tunisia",
  fullDesc: "An AI-powered education platform",
};

const assessment = { trlScore: 5, irScore: 72 };

describe("industry scoring", () => {
  test("industry exact match → near max (≥22 out of 25)", () => {
    const { categoryScores } = calculateMatchScore(
      investorProfile,
      project,
      assessment,
    );
    expect(categoryScores.industry).toBeGreaterThanOrEqual(22);
    expect(categoryScores.industry).toBeLessThanOrEqual(25);
  });

  test("industry mismatch → low pts (≤4)", () => {
    const { categoryScores } = calculateMatchScore(
      investorProfile,
      { ...project, industry: "Gaming" },
      assessment,
    );
    expect(categoryScores.industry).toBeLessThanOrEqual(4);
  });
});

describe("stage scoring", () => {
  test("stage exact match → near max (≥17 out of 20)", () => {
    const { categoryScores } = calculateMatchScore(
      investorProfile,
      project,
      assessment,
    );
    expect(categoryScores.stage).toBeGreaterThanOrEqual(17);
    expect(categoryScores.stage).toBeLessThanOrEqual(20);
  });

  test("stage far mismatch → low pts (≤4)", () => {
    const { categoryScores } = calculateMatchScore(
      investorProfile,
      { ...project, stage: "SCALING" },
      assessment,
    );
    expect(categoryScores.stage).toBeLessThanOrEqual(4);
  });
});

describe("technology scoring", () => {
  test("2 matching techs → score above midpoint (>10)", () => {
    const { categoryScores } = calculateMatchScore(
      investorProfile,
      project,
      assessment,
    );
    expect(categoryScores.technology).toBeGreaterThan(10);
  });

  test("3 matching techs → higher or equal score than 2 matching techs", () => {
    const { categoryScores: scores3 } = calculateMatchScore(
      investorProfile,
      { ...project, technologies: ["AI", "Blockchain", "Cloud"] },
      assessment,
    );
    const { categoryScores: scores2 } = calculateMatchScore(
      investorProfile,
      project,
      assessment,
    );
    expect(scores3.technology).toBeGreaterThanOrEqual(scores2.technology);
  });

  test("no exact tech overlap → lower than full match", () => {
    const { categoryScores: noMatch } = calculateMatchScore(
      investorProfile,
      { ...project, technologies: ["React", "Vue"] },
      assessment,
    );
    const { categoryScores: fullMatch } = calculateMatchScore(
      investorProfile,
      project,
      assessment,
    );
    expect(noMatch.technology).toBeLessThan(fullMatch.technology);
  });
});

describe("funding scoring", () => {
  test("funding in range → high pts (≥10 out of 15)", () => {
    const { categoryScores } = calculateMatchScore(
      investorProfile,
      project,
      assessment,
    );
    expect(categoryScores.funding).toBeGreaterThanOrEqual(10);
    expect(categoryScores.funding).toBeLessThanOrEqual(15);
  });

  test("funding far below min (100) → lower than in-range score", () => {
    const narrowProfile = {
      ...investorProfile,
      fundingMin: 500000,
      fundingMax: 1000000,
    };
    const { categoryScores: lowFunding } = calculateMatchScore(
      narrowProfile,
      { ...project, fundingSought: 100 },
      assessment,
    );
    const { categoryScores: inRange } = calculateMatchScore(
      narrowProfile,
      { ...project, fundingSought: 750000 },
      assessment,
    );
    expect(lowFunding.funding).toBeLessThan(inRange.funding);
  });

  test("funding well above max → low pts (≤4)", () => {
    const { categoryScores } = calculateMatchScore(
      investorProfile,
      { ...project, fundingSought: 5000000 },
      assessment,
    );
    expect(categoryScores.funding).toBeLessThanOrEqual(4);
  });
});

describe("geography scoring", () => {
  test("location matches geographicPrefs → high pts (≥4 out of 10)", () => {
    const { categoryScores } = calculateMatchScore(
      investorProfile,
      project,
      assessment,
    );
    expect(categoryScores.geography).toBeGreaterThanOrEqual(4);
    expect(categoryScores.geography).toBeLessThanOrEqual(10);
  });

  test("clearly mismatched location → low pts (≤3)", () => {
    const { categoryScores } = calculateMatchScore(
      investorProfile,
      { ...project, location: "Tokyo, Japan" },
      assessment,
    );
    expect(categoryScores.geography).toBeLessThanOrEqual(3);
  });

  test("no location → low pts (≤5)", () => {
    const { categoryScores } = calculateMatchScore(
      investorProfile,
      { ...project, location: null },
      assessment,
    );
    expect(categoryScores.geography).toBeLessThanOrEqual(5);
  });
});

describe("IR bonus scoring — crisp output, exact values expected", () => {
  test("irScore 72 → 7 pts", () => {
    const { categoryScores } = calculateMatchScore(investorProfile, project, {
      trlScore: 5,
      irScore: 72,
    });
    expect(categoryScores.irBonus).toBe(7);
  });

  test("irScore 100 → 10 pts", () => {
    const { categoryScores } = calculateMatchScore(investorProfile, project, {
      trlScore: 5,
      irScore: 100,
    });
    expect(categoryScores.irBonus).toBe(10);
  });

  test("irScore 50 → 5 pts", () => {
    const { categoryScores } = calculateMatchScore(investorProfile, project, {
      trlScore: 5,
      irScore: 50,
    });
    expect(categoryScores.irBonus).toBe(5);
  });

  test("irScore 0 → 0 pts", () => {
    const { categoryScores } = calculateMatchScore(investorProfile, project, {
      trlScore: 5,
      irScore: 0,
    });
    expect(categoryScores.irBonus).toBe(0);
  });
});

describe("penalties", () => {
  test("mustHave minTRL not met → matchScore reduced by 20 (or already 0)", () => {
    const { matchScore: withPenalty } = calculateMatchScore(
      { ...investorProfile, mustHaves: { minTRL: 7 } },
      project,
      { trlScore: 4, irScore: 72 },
    );
    const { matchScore: withoutPenalty } = calculateMatchScore(
      investorProfile,
      project,
      { trlScore: 4, irScore: 72 },
    );
    const diff = withoutPenalty - withPenalty;
    expect(diff === 20 || withPenalty === 0).toBe(true);
  });

  test("excluded industry → matchScore reduced by 50 (or already 0)", () => {
    const { matchScore: withPenalty } = calculateMatchScore(
      { ...investorProfile, exclusions: { industries: ["EdTech"] } },
      project,
      assessment,
    );
    const { matchScore: withoutPenalty } = calculateMatchScore(
      investorProfile,
      project,
      assessment,
    );
    const diff = withoutPenalty - withPenalty;
    expect(diff === 50 || withPenalty === 0).toBe(true);
  });

  test("matchScore never goes below 0 even with heavy penalties", () => {
    const { matchScore } = calculateMatchScore(
      {
        ...investorProfile,
        exclusions: { industries: ["EdTech"] },
        mustHaves: { minTRL: 9 },
      },
      { ...project, location: "Tokyo, Japan" },
      { trlScore: 1, irScore: 10 },
    );
    expect(matchScore).toBeGreaterThanOrEqual(0);

    expect(matchScore).toBeLessThanOrEqual(5);
  });

  test("matchScore never goes above 100", () => {
    const { matchScore } = calculateMatchScore(investorProfile, project, {
      trlScore: 9,
      irScore: 100,
    });
    expect(matchScore).toBeLessThanOrEqual(100);
  });
});

describe("full match", () => {
  test("good match returns high overall score (>60)", () => {
    const { matchScore, categoryScores } = calculateMatchScore(
      investorProfile,
      project,
      assessment,
    );
    expect(categoryScores.industry).toBeGreaterThanOrEqual(22);
    expect(categoryScores.stage).toBeGreaterThanOrEqual(17);
    expect(categoryScores.funding).toBeGreaterThanOrEqual(10);
    expect(categoryScores.geography).toBeGreaterThanOrEqual(4);
    expect(categoryScores.irBonus).toBe(7);
    expect(matchScore).toBeGreaterThan(60);
  });

  test("reasoning object has all correct fields", () => {
    const { reasoning } = calculateMatchScore(
      investorProfile,
      project,
      assessment,
    );
    expect(reasoning).toHaveProperty("industryFit");
    expect(reasoning).toHaveProperty("stageFit");
    expect(reasoning).toHaveProperty("technologyFit");
    expect(reasoning).toHaveProperty("fundingFit");
    expect(reasoning).toHaveProperty("geographyFit");
    expect(reasoning).toHaveProperty("thesisAlignment");
    expect(reasoning).toHaveProperty("irScore");
    expect(reasoning).toHaveProperty("profileComplete");
  });

  test("reasoning string values are valid labels", () => {
    const { reasoning } = calculateMatchScore(
      investorProfile,
      project,
      assessment,
    );
    expect(["Exact", "Partial", "Weak"]).toContain(reasoning.industryFit);
    expect(["Exact", "Adjacent", "Outside range"]).toContain(
      reasoning.stageFit,
    );
    expect(["In range", "Close", "Out of range"]).toContain(
      reasoning.fundingFit,
    );
    expect(["Match", "Partial", "Mismatch"]).toContain(reasoning.geographyFit);
    expect(typeof reasoning.profileComplete).toBe("boolean");
  });

  test("exact industry match → reasoning shows Exact", () => {
    const { reasoning } = calculateMatchScore(
      investorProfile,
      project,
      assessment,
    );
    expect(reasoning.industryFit).toBe("Exact");
  });

  test("exact stage match → reasoning shows Exact", () => {
    const { reasoning } = calculateMatchScore(
      investorProfile,
      project,
      assessment,
    );
    expect(reasoning.stageFit).toBe("Exact");
  });

  test("funding in range → reasoning shows In range", () => {
    const { reasoning } = calculateMatchScore(
      investorProfile,
      project,
      assessment,
    );
    expect(reasoning.fundingFit).toBe("In range");
  });
});

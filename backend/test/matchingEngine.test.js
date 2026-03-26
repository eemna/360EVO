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
  test("industry match → 25 pts", async () => {
    const { categoryScores } = await calculateMatchScore(
      investorProfile,
      project,
      assessment,
    );
    expect(categoryScores.industry).toBe(25);
  });

  test("industry mismatch → 0 pts", async () => {
    const { categoryScores } = await calculateMatchScore(
      investorProfile,
      { ...project, industry: "Gaming" },
      assessment,
    );
    expect(categoryScores.industry).toBe(0);
  });
});

describe("stage scoring", () => {
  test("stage match → 20 pts", async () => {
    const { categoryScores } = await calculateMatchScore(
      investorProfile,
      project,
      assessment,
    );
    expect(categoryScores.stage).toBe(20);
  });

  test("stage mismatch → 0 pts", async () => {
    const { categoryScores } = await calculateMatchScore(
      investorProfile,
      { ...project, stage: "SCALING" },
      assessment,
    );
    expect(categoryScores.stage).toBe(0);
  });
});

describe("technology scoring", () => {
  test("2 matching techs → 10 pts", async () => {
    const { categoryScores } = await calculateMatchScore(
      investorProfile,
      project,
      assessment,
    );
    expect(categoryScores.technology).toBe(10);
  });

  test("3 matching techs → 15 pts", async () => {
    const { categoryScores } = await calculateMatchScore(
      investorProfile,
      { ...project, technologies: ["AI", "Blockchain", "Cloud", "API"] },
      assessment,
    );
    expect(categoryScores.technology).toBe(15);
  });

  test("no matching techs → 0 pts", async () => {
    const { categoryScores } = await calculateMatchScore(
      investorProfile,
      { ...project, technologies: ["React", "Vue"] },
      assessment,
    );
    expect(categoryScores.technology).toBe(0);
  });
});

describe("funding scoring", () => {
  test("funding in range → 15 pts", async () => {
    const { categoryScores } = await calculateMatchScore(
      investorProfile,
      project,
      assessment,
    );
    expect(categoryScores.funding).toBe(15);
  });

  test("funding below min → 0 pts", async () => {
    const { categoryScores } = await calculateMatchScore(
      investorProfile,
      { ...project, fundingSought: 5000 },
      assessment,
    );
    expect(categoryScores.funding).toBe(0);
  });

  test("funding above max → 0 pts", async () => {
    const { categoryScores } = await calculateMatchScore(
      investorProfile,
      { ...project, fundingSought: 1000000 },
      assessment,
    );
    expect(categoryScores.funding).toBe(0);
  });
});

describe("geography scoring", () => {
  test("location matches geographicPrefs → 10 pts", async () => {
    const { categoryScores } = await calculateMatchScore(
      investorProfile,
      project,
      assessment,
    );
    expect(categoryScores.geography).toBe(10);
  });

  test("location does not match → 0 pts", async () => {
    const { categoryScores } = await calculateMatchScore(
      investorProfile,
      { ...project, location: "Tokyo, Japan" },
      assessment,
    );
    expect(categoryScores.geography).toBe(0);
  });

  test("no location → 0 pts", async () => {
    const { categoryScores } = await calculateMatchScore(
      investorProfile,
      { ...project, location: null },
      assessment,
    );
    expect(categoryScores.geography).toBe(0);
  });
});

describe("IR bonus scoring", () => {
  test("irScore >= 70 → 10 pts", async () => {
    const { categoryScores } = await calculateMatchScore(
      investorProfile,
      project,
      { trlScore: 5, irScore: 70 },
    );
    expect(categoryScores.irBonus).toBe(10);
  });

  test("irScore 50-69 → 5 pts", async () => {
    const { categoryScores } = await calculateMatchScore(
      investorProfile,
      project,
      { trlScore: 5, irScore: 55 },
    );
    expect(categoryScores.irBonus).toBe(5);
  });

  test("irScore < 50 → 0 pts", async () => {
    const { categoryScores } = await calculateMatchScore(
      investorProfile,
      project,
      { trlScore: 5, irScore: 30 },
    );
    expect(categoryScores.irBonus).toBe(0);
  });
});

describe("penalties", () => {
  test("mustHave minTRL not met → -20 penalty", async () => {
    const { categoryScores } = await calculateMatchScore(
      { ...investorProfile, mustHaves: { minTRL: 7 } },
      project,
      { trlScore: 4, irScore: 72 },
    );
    expect(categoryScores.penalty).toBe(-20);
  });

  test("excluded industry → -50 penalty", async () => {
    const { categoryScores } = await calculateMatchScore(
      { ...investorProfile, exclusions: { industries: ["EdTech"] } },
      project,
      assessment,
    );
    expect(categoryScores.penalty).toBe(-50);
  });

  test("matchScore never goes below 0", async () => {
    const { matchScore } = await calculateMatchScore(
      {
        ...investorProfile,
        exclusions: { industries: ["EdTech"] },
        mustHaves: { minTRL: 9 },
      },
      { ...project, location: "Tokyo, Japan" }, // ← add this, no geo match
      { trlScore: 1, irScore: 10 },
    );
    expect(matchScore).toBe(0);
  });

  test("matchScore never goes above 100", async () => {
    const { matchScore } = await calculateMatchScore(investorProfile, project, {
      trlScore: 9,
      irScore: 100,
    });
    expect(matchScore).toBeLessThanOrEqual(100);
  });
});

describe("full match", () => {
  test("perfect match returns high score", async () => {
    const { matchScore, categoryScores } = await calculateMatchScore(
      investorProfile,
      project,
      assessment,
    );
    expect(categoryScores.industry).toBe(25);
    expect(categoryScores.stage).toBe(20);
    expect(categoryScores.funding).toBe(15);
    expect(categoryScores.geography).toBe(10);
    expect(categoryScores.irBonus).toBe(10);
    expect(matchScore).toBeGreaterThan(70);
  });

  test("reasoning object has all fields", async () => {
    const { reasoning } = await calculateMatchScore(
      investorProfile,
      project,
      assessment,
    );
    expect(reasoning).toHaveProperty("industryMatch", true);
    expect(reasoning).toHaveProperty("stageMatch", true);
    expect(reasoning).toHaveProperty("techOverlap");
    expect(reasoning).toHaveProperty("fundingInRange");
    expect(reasoning).toHaveProperty("geoMatch");
    expect(reasoning).toHaveProperty("irScore");
  });
});

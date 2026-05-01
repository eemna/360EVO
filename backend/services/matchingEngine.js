import {
  fuzzifyIndustry,
  fuzzifyStage,
  fuzzifyFunding,
  fuzzifyTechnology,
  fuzzifyThesis,
  fuzzifyGeography,
  inferIndustry,
  inferStage,
  inferFunding,
  inferTechnology,
  inferGeography,
  defuzzifyCategory,
} from "./fuzzylogic.js";

function irBonusCrisp(assessment) {
  if (!assessment?.irScore) return 0;

  return Math.round((assessment.irScore / 100) * 10);
}

export function calculateMatchScore(investorProfile, project, assessment) {
  const irScore = assessment?.irScore || 0;

  const thesisFuzzy = fuzzifyThesis(
    investorProfile.investmentThesis,
    project.fullDesc,
  );

  const thesisSim = thesisFuzzy._rawSimilarity || 0;

  const industryFuzzy = fuzzifyIndustry(
    investorProfile.industries,
    project.industry,
  );

  //const industryHigh = industryFuzzy.high;

  const techFuzzy = fuzzifyTechnology(
    investorProfile.technologies,
    project.technologies,
    project.fullDesc,
  );
  const overlapRatio = techFuzzy._overlapRatio;
  const nlpSim = techFuzzy._nlpSim;

  // INDUSTRY — 25 pts

  const industryOutput = inferIndustry(industryFuzzy, { thesisSim });
  const industryScore = defuzzifyCategory(industryOutput, 25);

  // STAGE — 20 pts

  const stageFuzzy = fuzzifyStage(investorProfile.stages, project.stage);
  const stageOutput = inferStage(stageFuzzy, { irScore });
  const stageScore = defuzzifyCategory(stageOutput, 20);

  // TECHNOLOGY — 20 pts

  const technologyOutput = inferTechnology(techFuzzy, { overlapRatio, nlpSim });
  const technologyScore = defuzzifyCategory(technologyOutput, 20);

  // FUNDING — 15 pts

  const fundingFuzzy = fuzzifyFunding(investorProfile, project);
  const fundingOutput = inferFunding(fundingFuzzy, { irScore });
  const fundingScore = defuzzifyCategory(fundingOutput, 15);

  // GEOGRAPHY — 10 pts

  const geoFuzzy = fuzzifyGeography(investorProfile, project);
  const geoOutput = inferGeography(geoFuzzy, {
    projectLocation: project.location,
  });
  const geoScore = defuzzifyCategory(geoOutput, 10);

  const irBonus = irBonusCrisp(assessment);

  let rawScore =
    industryScore +
    stageScore +
    technologyScore +
    fundingScore +
    geoScore +
    irBonus;

  // ── Hard penalties
  const mustHaves = investorProfile.mustHaves || {};
  const exclusions = investorProfile.exclusions || {};
  if (mustHaves.minTRL && assessment?.trlScore < mustHaves.minTRL)
    rawScore -= 20;
  if (exclusions.industries?.includes(project.industry)) {
    rawScore -= 50;
  }
  const matchScore = Math.max(0, Math.min(100, Math.round(rawScore)));

  const categoryScores = {
    industry: Math.round(industryScore),
    stage: Math.round(stageScore),
    technology: Math.round(technologyScore),
    funding: Math.round(fundingScore),
    geography: Math.round(geoScore),
    irBonus,
  };

  const reasoning = {
    industryFit:
      industryFuzzy.high === 1.0
        ? "Exact"
        : industryFuzzy.medium > 0.5
          ? "Partial"
          : "Weak",

    stageFit:
      stageFuzzy.high === 1.0
        ? "Exact"
        : stageFuzzy.medium > 0.5
          ? "Adjacent"
          : "Outside range",

    fundingFit:
      fundingFuzzy.high > 0.8
        ? "In range"
        : fundingFuzzy.medium > 0.3
          ? "Close"
          : "Out of range",

    technologyFit:
      techFuzzy._overlapRatio > 0.5
        ? "Strong overlap"
        : techFuzzy._nlpSim > 0.2
          ? "Semantic match"
          : "Weak",

    thesisAlignment:
      thesisSim > 0.35 ? "Strong" : thesisSim > 0.15 ? "Moderate" : "Weak",

    geographyFit:
      geoFuzzy.high === 1.0
        ? "Match"
        : geoFuzzy.medium > 0
          ? "Partial"
          : "Mismatch",

    irScore: `${irScore}/100`,

    profileComplete: !isProfileIncomplete(investorProfile),
  };

  return { matchScore, categoryScores, reasoning };
}

function isProfileIncomplete(profile) {
  return (
    (!profile.industries || profile.industries.length === 0) &&
    (!profile.stages || profile.stages.length === 0) &&
    (!profile.investmentThesis || profile.investmentThesis.length < 50)
  );
}

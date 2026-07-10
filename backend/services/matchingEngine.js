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
  const trlScore = assessment?.trlScore || 1;

  const thesisFuzzy = fuzzifyThesis(
    investorProfile.investmentThesis,
    project.fullDesc,
  );

  const thesisSim = thesisFuzzy._rawSimilarity || 0;
  console.log("[DEBUG] thesisSim =", thesisSim);
  //const industryHigh = industryFuzzy.high;

  const techFuzzy = fuzzifyTechnology(
    investorProfile.technologies,
    project.technologies,
    project.fullDesc,
  );
  const overlapRatio = techFuzzy._overlapRatio;
  const nlpSim = techFuzzy._nlpSim;

  // INDUSTRY — 25 pts
  const industryFuzzy = fuzzifyIndustry(
    investorProfile.industries,
    project.industry,
  );
  const industryOutput = inferIndustry(industryFuzzy, { thesisSim });
  const industryScore = defuzzifyCategory(industryOutput, 25);

  // STAGE — 20 pts

  const stageFuzzy = fuzzifyStage(investorProfile.stages, project.stage);
  const stageOutput = inferStage(stageFuzzy, { trlScore });
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
  if (
    mustHaves.minTRL !== undefined &&
    assessment?.trlScore < mustHaves.minTRL
  ) {
    rawScore -= 20;
  }
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

  const strengths = [];
  const concerns = [];

  if (industryFuzzy.high === 1.0) strengths.push("Strong industry alignment");
  else if (industryFuzzy.low === 1.0)
    concerns.push("Industry doesn't match investor preferences");

  if (stageFuzzy.high === 1.0)
    strengths.push("Project stage exactly matches investor preference");
  else if (stageFuzzy.low > 0.5)
    concerns.push("Project stage is outside investor's preferred range");

  if (fundingFuzzy.high > 0.8)
    strengths.push("Funding sought is within investor's range");
  else if (fundingFuzzy.low === 1.0)
    concerns.push("Funding sought is outside investor's range");

  if (techFuzzy._overlapRatio > 0.5)
    strengths.push("Strong overlap in technology focus");
  else if (techFuzzy._overlapRatio < 0.2 && techFuzzy._nlpSim < 0.2)
    concerns.push("Limited technology alignment");

  if (thesisSim > 0.35)
    strengths.push("Project aligns well with investment thesis");
  else if (thesisSim < 0.15 && investorProfile.investmentThesis)
    concerns.push("Weak alignment with stated investment thesis");

  if (geoFuzzy.high === 1.0)
    strengths.push("Location matches investor's geographic preference");
  else if (geoFuzzy.low === 1.0)
    concerns.push("Location outside investor's geographic preference");

  if (assessment?.irScore >= 70)
    strengths.push("High Investment Readiness score");
  else if (assessment?.irScore && assessment.irScore < 40)
    concerns.push("Low Investment Readiness score");

  if (isProfileIncomplete(investorProfile))
    concerns.push(
      "Investor profile is incomplete — match quality may be reduced",
    );

  const reasoning = { strengths, concerns };

  return { matchScore, categoryScores, reasoning };
}

function isProfileIncomplete(profile) {
  return (
    (!profile.industries || profile.industries.length === 0) &&
    (!profile.stages || profile.stages.length === 0) &&
    (!profile.investmentThesis || profile.investmentThesis.length < 50)
  );
}

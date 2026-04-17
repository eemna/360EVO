
import {
  fuzzifyIndustry, fuzzifyStage, fuzzifyFunding,
  fuzzifyTechnology, fuzzifyThesis, fuzzifyGeography,
  inferIndustry, inferStage, inferFunding,
  inferTechnology, inferGeography, inferThesis,
  defuzzifyCategory,
  
} from "./fuzzylogic.js";

function irBonusCrisp(assessment) {
  if (!assessment?.irScore) return 0;
  if (assessment.irScore >= 70) return 10;
  if (assessment.irScore >= 50) return 5;
  return 0;
}

export async function calculateMatchScore(investorProfile, project, assessment) {
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
  // industryHigh is used by inferThesis to weight how much thesis alignment
  // should be trusted when industry doesn't match
  const industryHigh = industryFuzzy.high;

  // ── Technology raw signals (kept separate for inferTechnology rules) ───────
  const techFuzzy = fuzzifyTechnology(
    investorProfile.technologies,
    project.technologies,
    project.fullDesc,
  );
  const overlapRatio = techFuzzy._overlapRatio;
  const nlpSim       = techFuzzy._nlpSim;

  // ═══════════════════════════════════════════════════════════════════════════
  // INDUSTRY — 25 pts
  // Inference context: thesisSim
  //   A related industry + strong thesis → promote toward high
  //   A related industry + weak thesis   → demote toward low
  // ═══════════════════════════════════════════════════════════════════════════
  const industryOutput = inferIndustry(industryFuzzy, { thesisSim });
  const industryScore  = defuzzifyCategory(industryOutput, 25);

  // ═══════════════════════════════════════════════════════════════════════════
  // STAGE — 20 pts
  // Inference context: irScore
  //   Adjacent stage + high-quality project → good enough, promote
  //   Adjacent stage + low-quality project  → mismatch matters more, demote
  // ═══════════════════════════════════════════════════════════════════════════
  const stageFuzzy  = fuzzifyStage(investorProfile.stages, project.stage);
  const stageOutput = inferStage(stageFuzzy, { irScore });
  const stageScore  = defuzzifyCategory(stageOutput, 20);

  // ═══════════════════════════════════════════════════════════════════════════
  // TECHNOLOGY — 20 pts
  // Inference context: overlapRatio, nlpSim (unpacked from fuzzify)
  //   Exact match alone → high
  //   Semantic match without exact tags → medium (not high — less certain)
  //   Both agree → high boosted
  //   Both weak → low
  // ═══════════════════════════════════════════════════════════════════════════
  const technologyOutput = inferTechnology(techFuzzy, { overlapRatio, nlpSim });
  const technologyScore  = defuzzifyCategory(technologyOutput, 20);

  // ═══════════════════════════════════════════════════════════════════════════
  // FUNDING — 15 pts
  // Inference context: irScore
  //   Close to range + strong project → partial promotion
  //   Outside range + exceptional project → tiny rescue
  //   Outside range + weak project → stays low
  // ═══════════════════════════════════════════════════════════════════════════
  const fundingFuzzy  = fuzzifyFunding(investorProfile, project);
  const fundingOutput = inferFunding(fundingFuzzy, { irScore });
  const fundingScore  = defuzzifyCategory(fundingOutput, 15);

  // ═══════════════════════════════════════════════════════════════════════════
  // GEOGRAPHY — 10 pts
  // Inference context: projectLocation
  //   Uncertain profile + project is global → lean medium-high
  // ═══════════════════════════════════════════════════════════════════════════
  const geoFuzzy  = fuzzifyGeography(investorProfile, project);
  const geoOutput = inferGeography(geoFuzzy, { projectLocation: project.location });
  const geoScore  = defuzzifyCategory(geoOutput, 10);

  // ═══════════════════════════════════════════════════════════════════════════
  // THESIS (NLP) — soft bonus up to +5 pts
  // Inference context: industryHigh
  //   Thesis aligned + industry also matches → stronger signal, boosted
  //   Thesis aligned + industry mismatch → reduced (less trustworthy alone)
  // ═══════════════════════════════════════════════════════════════════════════
  const thesisOutput = inferThesis(thesisFuzzy, { industryHigh });
  const thesisBonus  = Math.round(thesisOutput.high * 5);

  // ── IR bonus (crisp) — 10 pts ─────────────────────────────────────────────
  const irBonus = irBonusCrisp(assessment);

  // ── Sum ───────────────────────────────────────────────────────────────────
  let rawScore =
    industryScore +
    stageScore +
    technologyScore +
    fundingScore +
    geoScore +
    irBonus +
    thesisBonus;

  // ── Hard penalties ────────────────────────────────────────────────────────
  const mustHaves  = investorProfile.mustHaves  || {};
  const exclusions = investorProfile.exclusions || {};
  if (mustHaves.minTRL && assessment?.trlScore < mustHaves.minTRL) rawScore -= 20;
  if (exclusions.industries?.includes(project.industry)) rawScore = 0;

  const matchScore = Math.max(0, Math.min(100, Math.round(rawScore)));

  const categoryScores = {
    industry:   Math.round(industryScore),
    stage:      Math.round(stageScore),
    technology: Math.round(technologyScore),
    funding:    Math.round(fundingScore),
    geography:  Math.round(geoScore),
    irBonus,
    thesisBonus,
  };

  const reasoning = {
    industryMatch:    industryFuzzy.high  === 1.0,
    industryPartial:  industryFuzzy.medium > 0,
    stageMatch:       stageFuzzy.high     === 1.0,
    stageAdjacent:    stageFuzzy.medium   > 0.5,
    fundingInRange:   fundingFuzzy.high   > 0.8,
    fundingClose:     fundingFuzzy.medium > 0.3,
    geoMatch:         geoFuzzy.high       === 1.0,
    thesisNlpRaw:     thesisSim,
    thesisMembership: thesisFuzzy,
    profileIncomplete: isProfileIncomplete(investorProfile),
    irScore,
  };

  return { matchScore, categoryScores, reasoning };
}

function isProfileIncomplete(profile) {
  return (
    (!profile.industries || profile.industries.length === 0) &&
    (!profile.stages     || profile.stages.length === 0) &&
    (!profile.investmentThesis || profile.investmentThesis.length < 50)
  );
}
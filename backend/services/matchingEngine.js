
export async function calculateMatchScore(investorProfile, project, assessment) {
  let score = 0;
  const categoryScores = {};

  // ── INDUSTRY MATCH — 25% 
  const industryMatch = investorProfile.industries?.includes(project.industry);
  categoryScores.industry = industryMatch ? 25 : 0;
  score += categoryScores.industry;

  // ── STAGE MATCH — 20%
  const stageMatch = investorProfile.stages?.includes(project.stage);
  categoryScores.stage = stageMatch ? 20 : 0;
  score += categoryScores.stage;

  // ── TECHNOLOGY OVERLAP — 20%
  // 5 points per matching technology, max 20
  const techOverlap = project.technologies?.filter(t =>
    investorProfile.technologies?.includes(t)
  ).length || 0;
  categoryScores.technology = Math.min(techOverlap * 5, 20);
  score += categoryScores.technology;

  // ── FUNDING RANGE MATCH — 15% 
  const funding = Number(project.fundingSought || 0);
  const min     = Number(investorProfile.fundingMin || 0);
  const max     = Number(investorProfile.fundingMax || Infinity);
  categoryScores.funding = (funding >= min && funding <= max) ? 15 : 0;
  score += categoryScores.funding;

  // ── GEOGRAPHIC MATCH — 10% 
  const projectLocation = project.location?.toLowerCase() || "";
  const geoMatch = investorProfile.geographicPrefs?.some(
    pref => projectLocation.includes(pref.toLowerCase())
  );
  categoryScores.geography = geoMatch ? 10 : 0;
  score += categoryScores.geography;

  // ── IR SCORE BONUS — 10%
  const irBonus =
    assessment?.irScore >= 70 ? 10 :
    assessment?.irScore >= 50 ? 5  : 0;
  categoryScores.irBonus = irBonus;
  score += categoryScores.irBonus;

  // ── PENALTIES 

  // Must-have miss: -20
  const mustHaves = investorProfile.mustHaves || {};
  if (mustHaves.minTRL && assessment?.trlScore < mustHaves.minTRL) {
    score -= 20;
    categoryScores.penalty = (categoryScores.penalty || 0) - 20;
  }

  // Exclusion hit: -50
  const exclusions = investorProfile.exclusions || {};
  if (exclusions.industries?.includes(project.industry)) {
    score -= 50;
    categoryScores.penalty = (categoryScores.penalty || 0) - 50;
  }

  // ── FINAL SCORE
  const finalScore = Math.max(0, Math.min(100, score));

  return {
    matchScore: finalScore,
    categoryScores,
    reasoning: {
      industryMatch,
      stageMatch,
      techOverlap,
      fundingInRange: categoryScores.funding > 0,
      geoMatch:       categoryScores.geography > 0,
      irScore:        assessment?.irScore || 0,
    },
  };
}
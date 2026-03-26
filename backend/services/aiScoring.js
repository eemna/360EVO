
// STEP 1 — TRL SCORE (Technology Readiness Level 1 to 9)
// Based on: project stage, prototype existence, milestones, documents
export function calculateTRLScore(project) {
  const stage = project.stage;                          // IDEA | PROTOTYPE | MVP | GROWTH | SCALING
  const hasTeam = project.teamMembers?.length > 0;      
  const hasMilestones = project.milestones?.length > 0; 
  const hasCompletedMilestone = project.milestones?.some(m => m.completedAt !== null);
  const hasDocuments = project.documents?.length > 0;   
  const hasUpdates = project.updates?.length > 0;      
  if (stage === "IDEA") {
    if (hasTeam && hasMilestones && project.fullDesc?.length > 200) return 3;
    if (project.shortDesc?.length > 50) return 2;
    return 1;
  }

  if (stage === "PROTOTYPE") {
    if (hasDocuments && hasCompletedMilestone) return 5;
    if (hasTeam) return 4;
    return 4;
  }

  if (stage === "MVP") {
    if (hasUpdates && hasCompletedMilestone && hasTeam) return 7;
    if (hasCompletedMilestone) return 6;
    return 6;
  }

  if (stage === "GROWTH") {
    if (hasUpdates && hasDocuments) return 8;
    return 8;
  }

  if (stage === "SCALING") {
    return 9;
  }

  return 1; // fallback
}

// STEP 2 — TRL CONFIDENCE
export function calculateTRLConfidence(project) {
  const checks = [
    !!project.title,
    !!project.tagline,
    !!project.shortDesc,
    project.fullDesc?.length > 100,
    !!project.stage,
    !!project.industry,
    project.technologies?.length > 0,
    !!project.location,
    !!project.fundingSought,
    project.teamMembers?.length > 0,
    project.milestones?.length > 0,
    project.documents?.length > 0,
  ];

  const filled = checks.filter(Boolean).length;           // count how many are true
  const percentage = (filled / checks.length) * 100;      // convert to percentage

  if (percentage > 75) return "HIGH";
  if (percentage >= 40) return "MEDIUM";
  return "LOW";
}

// STEP 3 — INVESTMENT READINESS SUB-SCORES (each 0 to 100)
// 5 dimensions, each scored independently

// FINANCIAL — 25% weight
// Checks: funding goal set, currency, financial docs uploaded
export function financialScore(project) {
  let score = 0;

  if (project.fundingSought && Number(project.fundingSought) > 0) score += 40;
  if (project.currency) score += 20;                                           
  if (project.documents?.some(d =>
    d.name?.toLowerCase().includes("financial") ||
    d.name?.toLowerCase().includes("pitch") ||
    d.fileType === "application/pdf"
  )) score += 40;// financial doc uploaded

  return Math.min(score, 100);
}

// MARKET — 25% weight
// Checks: industry set, descriptions, technologies listed
export function marketScore(project) {
  let score = 0;

  if (project.industry) score += 20;
  if (project.shortDesc?.length > 80) score += 20;
  if (project.fullDesc?.length > 300) score += 30;
  if (project.technologies?.length >= 2) score += 15;
  if (project.technologies?.length >= 5) score += 15;

  return Math.min(score, 100);
}

// TEAM — 20% weight
// Checks: number of team members, roles defined, photos uploaded
export function teamScore(project) {
  let score = 0;
  const members = project.teamMembers || [];

  if (members.length >= 1) score += 30;
  if (members.length >= 2) score += 20;
  if (members.length >= 3) score += 10;
  if (members.every(m => m.role)) score += 20;          // all members have a role defined
  if (members.some(m => m.photo)) score += 20;          // at least one photo uploaded

  return Math.min(score, 100);
}

// TRACTION — 20% weight
// Checks: milestones completed, project updates posted, interests received
export function tractionScore(project) {
  let score = 0;
  const milestones = project.milestones || [];
  const completed = milestones.filter(m => m.completedAt !== null).length;

  if (milestones.length > 0) score += 20;               // has planned milestones
  if (completed >= 1) score += 20;                      // completed at least 1
  if (completed >= 3) score += 20;                      // completed 3 or more
  if (project.updates?.length >= 1) score += 20;        // posted at least 1 update
  if (project.updates?.length >= 3) score += 20;        // posted 3 or more updates

  return Math.min(score, 100);
}

// COMPETITIVE — 10% weight
// Checks: technologies listed, stage maturity, tagline quality
export function competitiveScore(project) {
  let score = 0;

  if (project.technologies?.length >= 1) score += 30;
  if (project.technologies?.length >= 3) score += 20;
  if (project.tagline?.length > 20) score += 25;
  if (["MVP", "GROWTH", "SCALING"].includes(project.stage)) score += 25;

  return Math.min(score, 100);
}

// STEP 4 — COMPOSITE IR SCORE + TOP 3 RECOMMENDATIONS
// Weights: Financial 25%, Market 25%, Team 20%, Traction 20%, Competitive 10%
export function irCompositeScore(project) {
  const breakdown = {
    financial:   financialScore(project),
    market:      marketScore(project),
    team:        teamScore(project),
    traction:    tractionScore(project),
    competitive: competitiveScore(project),
  };

  const composite = Math.round(
    breakdown.financial   * 0.25 +
    breakdown.market      * 0.25 +
    breakdown.team        * 0.20 +
    breakdown.traction    * 0.20 +
    breakdown.competitive * 0.10
  );

  const dimensionLabels = {
    financial:   "Add financial documents and set a clear funding goal",
    market:      "Expand your market description and technology stack",
    team:        "Complete team profiles with roles and photos",
    traction:    "Add milestones and post regular project updates",
    competitive: "List your key technologies and sharpen your tagline",
  };

  const recommendations = Object.entries(breakdown)
    .sort(([, a], [, b]) => a - b)   // sort ascending — weakest first
    .slice(0, 3)                      // take the 3 lowest
    .map(([key]) => dimensionLabels[key]); // map to human-readable text

  return { composite, breakdown, recommendations };
}


export function runRuleBasedScoring(project) {
  const trlScore      = calculateTRLScore(project);
  const trlConfidence = calculateTRLConfidence(project);
  const { composite: irScore, breakdown: irBreakdown, recommendations } = irCompositeScore(project);

  return {
    trlScore,
    trlConfidence,
    irScore,
    irBreakdown,
    recommendations,
  };
}
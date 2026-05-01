export function calculateTRLScore(project) {
  const stage = project.stage;
  const hasTeam = project.teamMembers?.length > 0;
  const hasMilestones = project.milestones?.length > 0;
  const hasCompletedMilestone = project.milestones?.some(
    (m) => m.completedAt !== null,
  );
  const hasDocuments = project.documents?.length > 0;
  const hasUpdates = project.updates?.length > 0;

  const hasIpProtection  = project.ipStatus === "PENDING" ||
                           project.ipStatus === "GRANTED";
  const hasGrantedIp     = project.ipStatus === "GRANTED";
  const pilotUsers       = project.pilotUsers ?? 0;
  const hasPilots        = pilotUsers > 0;
  const hasScaledPilots  = pilotUsers >= 100;

  let score;
  if (stage === "IDEA") {
    if (hasTeam && hasMilestones && project.fullDesc?.length > 200) score = 3;
    else if (project.shortDesc?.length > 50) score = 2;
    else score = 1;

    if (hasIpProtection && score < 3) score = 3;

  } else if (stage === "PROTOTYPE") {
    if (hasDocuments && hasCompletedMilestone && hasIpProtection) score = 5;
    else score = 4;

  } else if (stage === "MVP") {
    if (hasUpdates && hasCompletedMilestone && hasTeam && hasPilots) score = 7;
    else score = 6;

    if (hasGrantedIp && score < 7) score = 7;

  } else if (stage === "GROWTH") {
    score = (hasGrantedIp && hasScaledPilots) ? 9 : 8;

  } else if (stage === "SCALING") {
    score = 9;

  } else {
    score = 1;
  }

  score = Math.max(1, Math.min(9, score));
  const breakdown = {
    stage,
    hasTeam,
    hasMilestones,
    hasCompletedMilestone,
    hasDocuments,
    hasUpdates,
    ipStatus:   project.ipStatus ?? "NONE",
    pilotUsers,
  };

  return { score, breakdown };
}
// TRL CONFIDENCE
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

  const filled = checks.filter(Boolean).length;
  const percentage = (filled / checks.length) * 100;

  if (percentage > 75) return "HIGH";
  if (percentage >= 40) return "MEDIUM";
  return "LOW";
}

//  INVESTMENT READINESS SUB-SCORES (each 0 to 100)

export function financialScore(project) {
  let score = 0;

  if (project.fundingSought && Number(project.fundingSought) > 0) score += 40;
  if (project.currency) score += 20;
  if (
    project.documents?.some(
      (d) =>
        d.name?.toLowerCase().includes("financial") ||
        d.name?.toLowerCase().includes("pitch") ||
        d.fileType === "application/pdf",
    )
  )
    score += 40;

  return Math.min(score, 100);
}

export function marketScore(project) {
  let score = 0;

  if (project.industry) score += 20;
  if (project.shortDesc?.length > 80) score += 20;
  if (project.fullDesc?.length > 300) score += 30;
  if (project.technologies?.length >= 2) score += 15;
  if (project.technologies?.length >= 5) score += 15;

  return Math.min(score, 100);
}

export function teamScore(project) {
  let score = 0;
  const members = project.teamMembers || [];

  if (members.length >= 1) score += 30;
  if (members.length >= 2) score += 20;
  if (members.length >= 3) score += 10;
  if (members.every((m) => m.role)) score += 20;
  if (members.some((m) => m.photo)) score += 20;

  return Math.min(score, 100);
}

export function tractionScore(project) {
  let score = 0;
  const milestones = project.milestones ?? [];
  const completed = milestones.filter((m) => m.completedAt !== null).length;
  const pilotUsers = project.pilotUsers ?? 0;

  if (milestones.length > 0) score += 15;
  if (completed >= 1)        score += 15;
  if (completed >= 3)        score += 15;
  if ((project.updates?.length ?? 0) >= 1) score += 10;
  if ((project.updates?.length ?? 0) >= 3) score += 10;
  if (pilotUsers >= 1)       score += 10;
  if (pilotUsers >= 50)      score += 15;
  if (pilotUsers >= 100)     score += 10;

  return Math.min(score, 100);
}

export function competitiveScore(project) {
  let score = 0;

  if ((project.technologies?.length ?? 0) >= 1) score += 25;
  if ((project.technologies?.length ?? 0) >= 3) score += 15;
  if ((project.tagline?.length ?? 0) > 20)      score += 20;
  if (["MVP", "GROWTH", "SCALING"].includes(project.stage)) score += 20;

  if (project.ipStatus === "PENDING") score += 10;
  if (project.ipStatus === "GRANTED") score += 20;

  return Math.min(score, 100);
}

export function irCompositeScore(project) {
  const breakdown = {
    financial: financialScore(project),
    market: marketScore(project),
    team: teamScore(project),
    traction: tractionScore(project),
    competitive: competitiveScore(project),
  };

  const composite = Math.round(
    breakdown.financial * 0.25 +
      breakdown.market * 0.25 +
      breakdown.team * 0.2 +
      breakdown.traction * 0.2 +
      breakdown.competitive * 0.1,
  );

  const dimensionLabels = {
    financial: "Add financial documents and set a clear funding goal",
    market: "Expand your market description and technology stack",
    team: "Complete team profiles with roles and photos",
    traction: "Add milestones and post regular project updates",
    competitive: "List your key technologies and sharpen your tagline",
  };

  const recommendations = Object.entries(breakdown)
    .sort(([, a], [, b]) => a - b)
    .slice(0, 3)
    .map(([key]) => dimensionLabels[key]);
  return { composite, breakdown, recommendations };
}

export function runRuleBasedScoring(project) {
  const { score: trlScore, breakdown: trlBreakdown } =
    calculateTRLScore(project);
  const trlConfidence = calculateTRLConfidence(project);
  const {
    composite: irScore,
    breakdown: irBreakdown,
    recommendations,
  } = irCompositeScore(project);

  return {
    trlScore,
    trlBreakdown,
    trlConfidence,
    irScore,
    irBreakdown,
    recommendations,
  };
}

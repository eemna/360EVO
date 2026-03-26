export function generateNarrative(project, trlScore, irScore, irBreakdown) {
  const stageText =
    {
      IDEA: "an early-stage concept",
      PROTOTYPE: "a prototype-stage venture",
      MVP: "a minimum viable product",
      GROWTH: "a growth-stage company",
      SCALING: "a scaling-phase business",
    }[project.stage] || "a startup";

  const irLevel =
    irScore >= 75
      ? "strong"
      : irScore >= 50
        ? "moderate"
        : irScore >= 30
          ? "developing"
          : "early";

  const trlLevel =
    trlScore >= 7
      ? "technically mature"
      : trlScore >= 4
        ? "in active development"
        : "at an early technical stage";

  const executiveSummary =
    `${project.title} is ${stageText} operating in the ${project.industry} sector. ` +
    `The project demonstrates ${irLevel} investment readiness with an IR score of ${irScore}/100 ` +
    `and is ${trlLevel} with a TRL of ${trlScore}/9. ` +
    `${
      project.teamMembers?.length > 0
        ? `The team consists of ${project.teamMembers.length} member(s).`
        : "Team information is not yet complete."
    }`;

  const strengthMessages = {
    financial: `Strong financial clarity with a defined funding goal of ${project.currency} ${project.fundingSought}.`,
    market: `Well-defined market positioning in the ${project.industry} sector.`,
    team: `Solid team structure with ${project.teamMembers?.length || 0} defined roles.`,
    traction: `Good traction with ${project.milestones?.filter((m) => m.completedAt).length || 0} completed milestones.`,
    competitive: `Clear competitive positioning with ${project.technologies?.length || 0} listed technologies.`,
  };

  const riskMessages = {
    financial:
      "Financial documentation is incomplete which may reduce investor confidence.",
    market: "The market opportunity description needs further development.",
    team: "The team profile is not fully complete — a key concern for investors.",
    traction: "Limited traction evidence is available at this stage.",
    competitive:
      "Competitive differentiation could be more clearly articulated.",
  };

  const sorted = Object.entries(irBreakdown).sort(([, a], [, b]) => b - a);
  const top2Strengths = sorted
    .slice(0, 2)
    .map(([k]) => strengthMessages[k])
    .join(" ");
  const bottom2Risks = sorted
    .slice(-2)
    .map(([k]) => riskMessages[k])
    .join(" ");

  const techList =
    project.technologies?.slice(0, 3).join(", ") || "not specified";
  const maturity =
    trlScore >= 7
      ? "The technology is mature and validated."
      : trlScore >= 4
        ? "The technology is in active development with a working prototype."
        : "The technology is at an early stage with the core concept defined.";

  const marketOpportunityNarrative =
    `Operating in the ${project.industry} sector, ${project.title} leverages ` +
    `${techList} as core technologies. ${maturity} ` +
    `${project.location ? `The project is based in ${project.location}.` : ""}`;

  return {
    executiveSummary,
    strengthsNarrative: top2Strengths,
    risksNarrative: bottom2Risks,
    marketOpportunityNarrative,
  };
}

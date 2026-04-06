import { prisma } from "../config/prisma.js";

const VALID_RISK_TOLERANCE = ["LOW", "MEDIUM", "HIGH"];

function validatePayload(data) {
  if (
    data.riskTolerance &&
    !VALID_RISK_TOLERANCE.includes(data.riskTolerance)
  ) {
    return `riskTolerance must be one of: ${VALID_RISK_TOLERANCE.join(", ")}`;
  }

  for (const field of [
    "industries",
    "technologies",
    "stages",
    "geographicPrefs",
    "dealStructures",
  ]) {
    if (data[field] !== undefined && !Array.isArray(data[field])) {
      return `${field} must be an array`;
    }
  }

  if (
    data.fundingMin !== undefined &&
    data.fundingMax !== undefined &&
    Number(data.fundingMin) > Number(data.fundingMax)
  ) {
    return "fundingMin must be ≤ fundingMax";
  }

  return null;
}

export const getInvestorProfile = async (req, res) => {
  try {
    const profile = await prisma.investorProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!profile) {
      return res.status(404).json({
        message: "Investor profile not found. Use POST to create one.",
      });
    }

    res.status(200).json(profile);
  } catch (error) {
    console.error("GET /api/investor-profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const createInvestorProfile = async (req, res) => {
  try {
    const existing = await prisma.investorProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (existing) {
      return res
        .status(409)
        .json({ message: "Profile already exists. Use PUT to update it." });
    }

    const error = validatePayload(req.body);
    if (error) return res.status(400).json({ message: error });

    const {
      industries,
      technologies,
      stages,
      fundingMin,
      fundingMax,
      currency,
      geographicPrefs,
      riskTolerance,
      dealStructures,
      mustHaves,
      exclusions,
      investmentThesis,
    } = req.body;

    const profile = await prisma.investorProfile.create({
      data: {
        userId: req.user.id,
        industries: industries ?? [],
        technologies: technologies ?? [],
        stages: stages ?? [],
        fundingMin: fundingMin ?? null,
        fundingMax: fundingMax ?? null,
        currency: currency ?? null,
        geographicPrefs: geographicPrefs ?? [],
        riskTolerance: riskTolerance ?? "MEDIUM",
        dealStructures: dealStructures ?? [],
        mustHaves: mustHaves ?? null,
        exclusions: exclusions ?? null,
        investmentThesis: investmentThesis ?? null,
      },
    });

    res.status(201).json(profile);
  } catch (error) {
    console.error("POST /api/investor-profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateInvestorProfile = async (req, res) => {
  try {
    const existing = await prisma.investorProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!existing) {
      return res
        .status(404)
        .json({ message: "Profile not found. Use POST to create one first." });
    }

    const error = validatePayload(req.body);
    if (error) return res.status(400).json({ message: error });

    const patch = {};
    const fields = [
      "industries",
      "technologies",
      "stages",
      "fundingMin",
      "fundingMax",
      "currency",
      "geographicPrefs",
      "riskTolerance",
      "dealStructures",
      "mustHaves",
      "exclusions",
      "investmentThesis",
    ];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) patch[field] = req.body[field];
    });

    const updated = await prisma.investorProfile.update({
      where: { userId: req.user.id },
      data: patch,
    });
    await prisma.llmInsight.deleteMany({
      where: {
        investorId: req.user.id,
        type: "THESIS_ALIGNMENT",
      },
    });

    await prisma.match.updateMany({
      where: { investorId: req.user.id },
      data: { thesisAlignmentSummary: null },
    });
    res.status(200).json(updated);
  } catch (error) {
    console.error("PUT /api/investor-profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

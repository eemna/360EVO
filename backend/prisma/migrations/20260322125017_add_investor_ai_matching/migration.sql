-- CreateEnum
CREATE TYPE "TrlConfidence" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "LlmInsightType" AS ENUM ('THESIS_ALIGNMENT', 'PITCH_ANALYSIS', 'DD_SUMMARY', 'DEAL_BRIEF');

-- CreateEnum
CREATE TYPE "RiskTolerance" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('SUGGESTED', 'VIEWED', 'CONTACTED', 'DISMISSED');

-- CreateTable
CREATE TABLE "AiAssessment" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "trlScore" INTEGER NOT NULL,
    "trlConfidence" "TrlConfidence" NOT NULL,
    "trlBreakdown" JSONB NOT NULL,
    "irScore" INTEGER NOT NULL,
    "irBreakdown" JSONB NOT NULL,
    "recommendations" TEXT[],
    "executiveSummary" TEXT,
    "strengthsNarrative" TEXT,
    "risksNarrative" TEXT,
    "marketOpportunityNarrative" TEXT,
    "llmModel" TEXT,
    "assessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "AiAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LlmInsight" (
    "id" TEXT NOT NULL,
    "investorId" TEXT,
    "projectId" TEXT NOT NULL,
    "type" "LlmInsightType" NOT NULL,
    "content" JSONB NOT NULL,
    "inputHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LlmInsight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestorProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "industries" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "technologies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "stages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "fundingMin" DECIMAL(65,30),
    "fundingMax" DECIMAL(65,30),
    "currency" TEXT,
    "geographicPrefs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "riskTolerance" "RiskTolerance" NOT NULL DEFAULT 'MEDIUM',
    "dealStructures" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "mustHaves" JSONB,
    "exclusions" JSONB,
    "investmentThesis" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvestorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "investorId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "matchScore" INTEGER NOT NULL,
    "reasoning" JSONB,
    "categoryScores" JSONB,
    "thesisAlignmentSummary" TEXT,
    "status" "MatchStatus" NOT NULL DEFAULT 'SUGGESTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AiAssessment_projectId_key" ON "AiAssessment"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "LlmInsight_investorId_projectId_type_key" ON "LlmInsight"("investorId", "projectId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "InvestorProfile_userId_key" ON "InvestorProfile"("userId");

-- CreateIndex
CREATE INDEX "Match_investorId_status_idx" ON "Match"("investorId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Match_investorId_projectId_key" ON "Match"("investorId", "projectId");

-- AddForeignKey
ALTER TABLE "AiAssessment" ADD CONSTRAINT "AiAssessment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LlmInsight" ADD CONSTRAINT "LlmInsight_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LlmInsight" ADD CONSTRAINT "LlmInsight_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestorProfile" ADD CONSTRAINT "InvestorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

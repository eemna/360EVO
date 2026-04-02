-- CreateEnum
CREATE TYPE "DdStatus" AS ENUM ('PENDING', 'APPROVED', 'DECLINED');

-- CreateEnum
CREATE TYPE "DocAccess" AS ENUM ('OPEN', 'ON_REQUEST');

-- CreateTable
CREATE TABLE "DdRequest" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "investorId" TEXT NOT NULL,
    "status" "DdStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "nda" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "DdRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataRoom" (
    "id" TEXT NOT NULL,
    "ddRequestId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "investorId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "aiSummaryGenerated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataRoomDocument" (
    "id" TEXT NOT NULL,
    "dataRoomId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "accessLevel" "DocAccess" NOT NULL DEFAULT 'OPEN',
    "textExtract" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataRoomDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DdQaThread" (
    "id" TEXT NOT NULL,
    "dataRoomId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "askerId" TEXT NOT NULL,
    "aiSuggestedAnswer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DdQaThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DdQaResponse" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "responderId" TEXT NOT NULL,
    "isAiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DdQaResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiDealBrief" (
    "id" TEXT NOT NULL,
    "dataRoomId" TEXT NOT NULL,
    "investorId" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "AiDealBrief_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataRoomActivity" (
    "id" TEXT NOT NULL,
    "dataRoomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "docName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataRoomActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectAnalytics" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "bookmarks" INTEGER NOT NULL DEFAULT 0,
    "interests" INTEGER NOT NULL DEFAULT 0,
    "sources" JSONB,

    CONSTRAINT "ProjectAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DdRequest_projectId_investorId_key" ON "DdRequest"("projectId", "investorId");

-- CreateIndex
CREATE UNIQUE INDEX "DataRoom_ddRequestId_key" ON "DataRoom"("ddRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "AiDealBrief_dataRoomId_key" ON "AiDealBrief"("dataRoomId");

-- CreateIndex
CREATE INDEX "DataRoomActivity_dataRoomId_createdAt_idx" ON "DataRoomActivity"("dataRoomId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectAnalytics_projectId_date_key" ON "ProjectAnalytics"("projectId", "date");

-- AddForeignKey
ALTER TABLE "DdRequest" ADD CONSTRAINT "DdRequest_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DdRequest" ADD CONSTRAINT "DdRequest_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataRoom" ADD CONSTRAINT "DataRoom_ddRequestId_fkey" FOREIGN KEY ("ddRequestId") REFERENCES "DdRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataRoom" ADD CONSTRAINT "DataRoom_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataRoom" ADD CONSTRAINT "DataRoom_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataRoomDocument" ADD CONSTRAINT "DataRoomDocument_dataRoomId_fkey" FOREIGN KEY ("dataRoomId") REFERENCES "DataRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DdQaThread" ADD CONSTRAINT "DdQaThread_dataRoomId_fkey" FOREIGN KEY ("dataRoomId") REFERENCES "DataRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DdQaThread" ADD CONSTRAINT "DdQaThread_askerId_fkey" FOREIGN KEY ("askerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DdQaResponse" ADD CONSTRAINT "DdQaResponse_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "DdQaThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DdQaResponse" ADD CONSTRAINT "DdQaResponse_responderId_fkey" FOREIGN KEY ("responderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiDealBrief" ADD CONSTRAINT "AiDealBrief_dataRoomId_fkey" FOREIGN KEY ("dataRoomId") REFERENCES "DataRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiDealBrief" ADD CONSTRAINT "AiDealBrief_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataRoomActivity" ADD CONSTRAINT "DataRoomActivity_dataRoomId_fkey" FOREIGN KEY ("dataRoomId") REFERENCES "DataRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataRoomActivity" ADD CONSTRAINT "DataRoomActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectAnalytics" ADD CONSTRAINT "ProjectAnalytics_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

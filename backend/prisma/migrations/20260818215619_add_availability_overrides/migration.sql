-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "bookingHorizonDays" INTEGER,
ADD COLUMN     "minNoticeHours" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "AvailabilityOverride" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "isAvailable" BOOLEAN NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AvailabilityOverride_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AvailabilityOverride_profileId_date_idx" ON "AvailabilityOverride"("profileId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "AvailabilityOverride_profileId_date_key" ON "AvailabilityOverride"("profileId", "date");

-- AddForeignKey
ALTER TABLE "AvailabilityOverride" ADD CONSTRAINT "AvailabilityOverride_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

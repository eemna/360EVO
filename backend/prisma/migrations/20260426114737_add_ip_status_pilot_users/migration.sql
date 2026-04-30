-- CreateEnum
CREATE TYPE "IpStatus" AS ENUM ('NONE', 'PENDING', 'GRANTED');

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "ipStatus" "IpStatus" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "pilotUsers" INTEGER NOT NULL DEFAULT 0;

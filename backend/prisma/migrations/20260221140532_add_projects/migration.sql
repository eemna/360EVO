/*
  Warnings:

  - You are about to drop the column `search_vector` on the `Project` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX IF EXISTS "Project_search_vector_idx";


-- AlterTable
ALTER TABLE "Project"
DROP COLUMN IF EXISTS "search_vector";

ALTER TABLE "Project"
ADD COLUMN "featured" BOOLEAN NOT NULL DEFAULT false;

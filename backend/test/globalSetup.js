import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../.env.test"), override: true });

export default async function globalSetup() {
  const prisma = new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL } },
  });

  let retries = 5;
  while (retries > 0) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log("Test DB is awake");
      await prisma.$disconnect();
      return;
    } catch {
      console.log(`Waiting for DB... (${retries} retries left)`);
      await new Promise((r) => setTimeout(r, 3000));
      retries--;
    }
  }
  await prisma.$disconnect();
  throw new Error("Could not connect to test DB");
}

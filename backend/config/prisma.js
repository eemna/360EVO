import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient({
  log: [],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

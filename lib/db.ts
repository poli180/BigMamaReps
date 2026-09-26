import { PrismaClient } from "@prisma/client";
const globalDb = globalThis as unknown as { prisma?: PrismaClient };
export const databaseUrl = () =>
  process.env.SHOP_DATABASE_URL || process.env.DATABASE_URL;
export const db =
  globalDb.prisma ??
  new PrismaClient({
    ...(databaseUrl() ? { datasourceUrl: databaseUrl() } : {}),
  });
if (process.env.NODE_ENV !== "production") globalDb.prisma = db;
export const isDemo = () => !databaseUrl();

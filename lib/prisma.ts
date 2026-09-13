import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const connectionString = process.env.DATABASE_URL;

function createPrismaClient() {
  if (!connectionString) {
    // Allow build/lint without DATABASE_URL; runtime routes will fail gracefully.
    // Use a dummy adapter placeholder — actual queries will throw with a clear message.
    console.warn("[prisma] DATABASE_URL is not set — Prisma client created in stub mode");
    // Return a proxy that throws on any query attempt
    return new Proxy({} as PrismaClient, {
      get(_target, prop) {
        if (prop === "then") return undefined;
        throw new Error("DATABASE_URL is not set — cannot query database");
      },
    });
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// V dev rezime Next.js "hot-reloaduje" kod pri kazdej zmene suboru.
// Bez tohto by sa pri kazdom reloade vytvoril NOVY PrismaClient (a nove
// pripojenie na databazu), az by sa vycerpal limit pripojeni.
// Preto si instanciu ulozime do globalThis a znovupouzivame ju.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

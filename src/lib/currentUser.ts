import { prisma } from "@/lib/prisma";

// DOCASNE: kym nemame prihlasovanie, pracujeme s prvym userom v databaze.
// Ked pridame auth, tato funkcia sa nahradi citanim prihlaseneho usera
// (napr. zo session/cookie) a zvysny kod appky sa nezmeni.
export async function getCurrentUser() {
  const user = await prisma.user.findFirst();
  if (!user) {
    throw new Error(
      "Ziadny user v databaze. Spusti: node --env-file=.env prisma/seed.ts"
    );
  }
  return user;
}

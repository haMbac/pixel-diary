import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { User } from "@prisma/client";

export const SESSION_COOKIE = "pd_session";
// 30 dni pri "zapamätať si ma" (zaskrtnute pri prihlaseni/registracii -
// osobna appka pouzivana denne, netreba znova prihlasovat kazdy tyzden).
// 1 den bez toho - bezpecnostny strop pre pripad, ze by prehliadac session
// cookie (bez "expires", teda "session cookie") nezmazal hned pri zatvoreni.
const REMEMBER_DURATION_MS = 30 * 24 * 60 * 60 * 1000;
const SESSION_ONLY_DURATION_MS = 24 * 60 * 60 * 1000;
// Guest mod: ziadny email, teda ziadny sposob znova sa prihlasit z ineho
// zariadenia - cookie musi prezit zatvorenie prehliadaca prakticky navzdy,
// preto 365 dni namiesto beznych 30 (a proxy.ts si ju este aj priebezne
// predlzuje pri kazdej navsteve, pozri tam).
export const GUEST_DURATION_MS = 365 * 24 * 60 * 60 * 1000;

// Exportovane aj kvoli proxy.ts, ktory si tou istou cookie priebezne
// predlzuje platnost guest session pri kazdej navsteve (pozri tam).
export function sessionCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires: expiresAt,
  };
}

// Volat len zo Server Action/Route Handlera (nastavovanie cookies mimo
// nich Next.js zakazuje). "remember" = false vynecha "expires" z cookie
// (prehliadac ju zmaze pri zatvoreni), aj tak ale nastavi kratsi server-side
// "expiresAt" ako poistku.
export async function createSession(userId: string, remember: boolean): Promise<void> {
  const durationMs = remember ? REMEMBER_DURATION_MS : SESSION_ONLY_DURATION_MS;
  const expiresAt = new Date(Date.now() + durationMs);
  const session = await prisma.session.create({
    data: { userId, expiresAt },
  });
  const store = await cookies();
  const { expires, ...options } = sessionCookieOptions(expiresAt);
  store.set(SESSION_COOKIE, session.id, {
    ...options,
    ...(remember ? { expires } : {}),
  });
}

// Guest mod (bod "guest mode"): rovnaka cookie ako "remember" vetva
// createSession vyssie, len s ovela dlhsou platnostou - guest ucet nema
// email, takze cookie JE jediny sposob, ako sa vobec dostane spat k svojim
// datam.
export async function createGuestSession(userId: string): Promise<void> {
  const expiresAt = new Date(Date.now() + GUEST_DURATION_MS);
  const session = await prisma.session.create({
    data: { userId, expiresAt },
  });
  const store = await cookies();
  store.set(SESSION_COOKIE, session.id, sessionCookieOptions(expiresAt));
}

// Citanie cookies je povolene kdekolvek (aj v Server Components) - na
// rozdiel od zapisu vyssie.
export async function getSessionUser(): Promise<User | null> {
  const store = await cookies();
  const sessionId = store.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const sessionId = store.get(SESSION_COOKIE)?.value;
  if (sessionId) {
    await prisma.session.deleteMany({ where: { id: sessionId } });
  }
  store.delete(SESSION_COOKIE);
}

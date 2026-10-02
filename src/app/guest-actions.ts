"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createGuestSession, getSessionUser } from "@/lib/session";
import { getLocale } from "@/lib/locale";
import { dictionary } from "@/i18n/dictionary";

// Guest mod: ziadny email, ziadny overovaci kod - okamzite vytvorenie noveho
// anonymneho uctu a dlhodobej session (pozri createGuestSession).

// Bez emailu/CAPTCHA je toto jediny bod appky, ktory vie NEprihlaseny
// navstevnik volat opakovane a zadarmo tak zaplavit DB anonymnymi
// User+Session riadkami (bod "guest mode" review). Lahky guard: max jeden
// novy guest ucet na IP adresu za GUEST_CREATE_COOLDOWN_MS. Staci v pamati
// procesu (osobna appka na jednej instancii, nie serverless farma) - kvoli
// tomu nezakladame novu DB tabulku/migraciu navyse k uz nedeployovanej
// "guest_mode_nullable_email".
const GUEST_CREATE_COOLDOWN_MS = 60 * 1000;
const lastGuestCreateByIp = new Map<string, number>();

function pruneExpired(now: number): void {
  for (const [ip, at] of lastGuestCreateByIp) {
    if (now - at >= GUEST_CREATE_COOLDOWN_MS) lastGuestCreateByIp.delete(ip);
  }
}

// Za reverznou proxy (bezna produkcna topologia) je skutocna IP
// navstevnika v "x-forwarded-for" (prva hodnota v zozname, pripadne
// pridana proxy - klientom poslana hodnota by sa inak dala sfalsovat, ale
// tu ide len o lahky throttle, nie o autentifikaciu). Bez proxy padne na
// "x-real-ip", inak spolocny bucket "unknown" - stale lepsie nez ziadny
// limit.
function clientIp(headerList: Headers): string {
  const forwardedFor = headerList.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return headerList.get("x-real-ip") ?? "unknown";
}

export async function continueAsGuest() {
  // Stranka /login uz tento pripad odfiltruje (presmeruje prihlaseneho P
  // pred zobrazenim tlacidla), ale priamy POST na tuto akciu (stara
  // zalozka, dvojity submit) by inak ticho zalozil novy anonymny ucet a
  // prepisal cookie existujucej session - preto ista istota aj tu.
  if (await getSessionUser()) redirect("/");

  const now = Date.now();
  const ip = clientIp(await headers());

  pruneExpired(now);
  const lastCreateAt = lastGuestCreateByIp.get(ip);
  if (lastCreateAt !== undefined && now - lastCreateAt < GUEST_CREATE_COOLDOWN_MS) {
    // Throttlovane - bez noveho uctu sa jednoducho vrat na prihlasenie
    // (rovnaky vysledok ako zrusenie akcie, ziadna zmena UI netreba).
    redirect("/login");
  }
  lastGuestCreateByIp.set(ip, now);

  const locale = await getLocale();
  const t = dictionary[locale];

  const user = await prisma.user.create({ data: { name: t.auth.guestDefaultName, email: null } });
  await createGuestSession(user.id);
  redirect("/");
}

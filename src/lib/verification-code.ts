import { randomInt, createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mail";

const CODE_TTL_MS = 10 * 60 * 1000; // 10 minut
const MAX_ATTEMPTS = 5;

// "attempts" hore chrani len pred UHÁDNUTÍM kódu, nie pred jeho opakovaným
// VYŽIADANÍM - bez tohto by mohol ktokolvek zavolat issueCode() priamym
// POST-om (obídenim 30s tlačidla "Poslať znova" v UI, ktoré je len klientsky
// stav) toľkokrát, kolkokrát chce, a zaplavit cudziu schránku mailmi. Rovnaky
// vzor ako per-IP cooldown v guest-actions.ts, tu ale podla emailu (cielom
// utoku je schránka, nie vytvaranie uctov) a s rovnakou dlzkou ako klientsky
// "resend" cooldown, aby sa nikdy nesprotivili.
const REQUEST_COOLDOWN_MS = 30 * 1000;
const lastIssuedAtByEmail = new Map<string, number>();

function pruneExpired(now: number): void {
  for (const [email, at] of lastIssuedAtByEmail) {
    if (now - at >= REQUEST_COOLDOWN_MS) lastIssuedAtByEmail.delete(email);
  }
}

// crypto.randomInt (nie Math.random) - overovaci kod je bezpecnostne
// citlivy, potrebuje kryptograficky nahodny zdroj.
export function generateCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

// Ukladame len hash (SHA-256 staci - kod je aj tak kratkolive a
// rate-limitovany cez "attempts", nie dlhodoby tajny ako heslo).
export function hashCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

// Zdielane medzi prihlasenim, registraciou aj zmenou emailu v nastaveniach
// uctu (bod 1.1/2.11/2.2) - vsetky tri potrebuju presne to iste (vygenerovat
// kod, ulozit hash, poslat mail na cielovy email), lisi sa len podmienka
// PRED tymto krokom a to, co sa stane PO uspesnom overeni.
//
// Vrati false, ked sa mail nepodarilo odoslat (napr. Resend bez vlastnej
// domeny odmietne inu adresu nez tu, s ktorou je zaregistrovany) - volajuci
// ukaze chybu namiesto padu celej stranky.
export async function issueCode(email: string): Promise<boolean> {
  const now = Date.now();
  pruneExpired(now);
  const lastIssuedAt = lastIssuedAtByEmail.get(email);
  if (lastIssuedAt !== undefined && now - lastIssuedAt < REQUEST_COOLDOWN_MS) {
    // Uz bol nedavno poslany kod na tento email - druhy mail neposielame
    // (volajuci aj tak vzdy hlasi "sent: true", presne ako pri legitimnom
    // stlaceni "Poslať znova" po vyprsani cooldownu).
    return true;
  }
  lastIssuedAtByEmail.set(email, now);

  const code = generateCode();
  await prisma.loginCode.upsert({
    where: { email },
    create: { email, codeHash: hashCode(code), expiresAt: new Date(Date.now() + CODE_TTL_MS) },
    update: {
      codeHash: hashCode(code),
      attempts: 0,
      expiresAt: new Date(Date.now() + CODE_TTL_MS),
    },
  });

  try {
    await sendMail(
      email,
      "Tvoj overovací kód — Pixel diár",
      `<p>Tvoj overovací kód je:</p><h2 style="letter-spacing:4px">${code}</h2><p>Platí 10 minút.</p>`
    );
  } catch (error) {
    console.error("Odoslanie overovacieho kodu zlyhalo:", error);
    // Neodoslany kod nesmie blokovat dalsi pokus cooldownom.
    lastIssuedAtByEmail.delete(email);
    return false;
  }
  return true;
}

// Poslane raz, presne vo chvili, ked pokusy dosiahnu MAX_ATTEMPTS (nie pri
// kazdom dalsom zablokovanom pokuse potom - to by zaplavilo schranku pri
// opakovanom klikani po uzamknuti). Cielom emailu je majitel uctu, nie
// utocnik - upozorni ho, ze niekto sa snazil uhadnut jeho kod.
async function sendLockoutWarning(email: string): Promise<void> {
  await sendMail(
    email,
    "Upozornenie: viacero nesprávnych pokusov o kód — Pixel diár",
    `<p>Zaznamenali sme ${MAX_ATTEMPTS} nesprávnych pokusov o zadanie overovacieho kódu pre tento účet.</p><p>Ak si to nebol/a ty, nikto sa do tvojho účtu nedostal - kód je krátkodobý a po tomto počte pokusov je dočasne zablokovaný. Nemusíš nič robiť.</p>`
  );
}

// Zdielane overenie kodu - vracia null pri uspechu (kod uz zmazany, ako
// jednorazovy) alebo chybovu spravu. Co sa stane PO uspesnom overeni
// (najst/vytvorit/upravit usera) sa lisi podla situacie, preto NIE je
// sucastou tejto funkcie - ta rieši len samotne overenie kodu.
export async function checkAndConsumeCode(email: string, code: string): Promise<string | null> {
  const loginCode = await prisma.loginCode.findUnique({ where: { email } });
  if (!loginCode || loginCode.expiresAt < new Date()) {
    return "Kód vypršal. Vyžiadaj si nový.";
  }
  if (loginCode.attempts >= MAX_ATTEMPTS) {
    return "Príliš veľa nesprávnych pokusov. Vyžiadaj si nový kód.";
  }
  if (hashCode(code) !== loginCode.codeHash) {
    const updated = await prisma.loginCode.update({
      where: { email },
      data: { attempts: { increment: 1 } },
    });
    if (updated.attempts >= MAX_ATTEMPTS) {
      // Len upozornenie navyse - ked neodide, zablokovanie plati aj tak.
      await sendLockoutWarning(email).catch((error) =>
        console.error("Odoslanie upozornenia o zablokovani zlyhalo:", error)
      );
    }
    return "Nesprávny kód.";
  }

  await prisma.loginCode.delete({ where: { email } });
  return null;
}

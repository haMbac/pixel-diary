"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession } from "@/lib/session";
import { issueCode, checkAndConsumeCode } from "@/lib/verification-code";
import { getLocale } from "@/lib/locale";
import { dictionary } from "@/i18n/dictionary";

export type RequestCodeState = {
  error: string | null;
  sent: boolean;
  email: string;
  remember: boolean;
};

// Bod 1.1: P vyplni email a S mu naň posle overovaci kod. Zamerne
// NEexistuje "ucet s tymto emailom neexistuje ale nepoviem ti to" (bezna
// ochrana proti odhaleniu registrovanych emailov) - pre osobnu appku s
// dvoma znamymi uctami je jasna chybova hlaska uzitocnejsia nez tento
// druh utajenia.
export async function requestLoginCode(
  prevState: RequestCodeState,
  formData: FormData
): Promise<RequestCodeState> {
  const locale = await getLocale();
  const t = dictionary[locale];

  const emailRaw = formData.get("email");
  const email = typeof emailRaw === "string" ? emailRaw.trim().toLowerCase() : "";
  // Checkbox z kroku 1 - musi sa preniest do kroku 2 (kde sa az skutocne
  // vytvara session), preto je sucastou stavu, nie len lokalnej premennej.
  const remember = formData.get("remember") != null;
  if (!email) return { error: t.auth.enterEmailError, sent: false, email, remember };

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { error: t.auth.accountNotFoundError, sent: false, email, remember };
  }

  if (!(await issueCode(email))) {
    return { error: t.auth.emailSendFailedError, sent: false, email, remember };
  }
  return { error: null, sent: true, email, remember };
}

export type RequestSignupState = {
  error: string | null;
  sent: boolean;
  name: string;
  email: string;
  remember: boolean;
};

// Bod 2.11/2.12: registracia noveho uctu - rovnaky kodovy mechanizmus ako
// prihlasenie, len opacna podmienka (email este NESMIE existovat). GDPR
// suhlas a notifikacne preferencie zo specifikacie su tu zamerne vynechane
// (rozhodnute v konverzacii - ziadna funkcia notifikacii zatial neexistuje,
// zbierat pre nu preferenciu vopred by bolo predcasne).
export async function requestSignupCode(
  prevState: RequestSignupState,
  formData: FormData
): Promise<RequestSignupState> {
  const locale = await getLocale();
  const t = dictionary[locale];

  const nameRaw = formData.get("name");
  const emailRaw = formData.get("email");
  const name = typeof nameRaw === "string" ? nameRaw.trim() : "";
  const email = typeof emailRaw === "string" ? emailRaw.trim().toLowerCase() : "";
  const remember = formData.get("remember") != null;

  if (!name) return { error: t.auth.enterNameError, sent: false, name, email, remember };
  if (!email) return { error: t.auth.enterEmailError, sent: false, name, email, remember };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: t.auth.accountExistsError, sent: false, name, email, remember };
  }

  if (!(await issueCode(email))) {
    return { error: t.auth.emailSendFailedError, sent: false, name, email, remember };
  }
  return { error: null, sent: true, name, email, remember };
}

export type VerifyCodeState = { error: string | null };

// Bod 1.1: overenie kodu. Nespravny kod NEVYHADZUJE P spat na zadavanie
// emailu (doslovne znenie specifikacie), len ostava na tejto istej
// obrazovke s vycistenym polom - citatelnejsie UX pre bezny preklep, pozri
// poznamku v konverzacii.
export async function verifyLoginCode(
  prevState: VerifyCodeState,
  formData: FormData
): Promise<VerifyCodeState> {
  const locale = await getLocale();
  const t = dictionary[locale];

  const emailRaw = formData.get("email");
  const codeRaw = formData.get("code");
  const email = typeof emailRaw === "string" ? emailRaw.trim().toLowerCase() : "";
  const code = typeof codeRaw === "string" ? codeRaw.trim() : "";
  if (!email || !code) return { error: t.auth.enterCodeError };

  const error = await checkAndConsumeCode(email, code);
  if (error) return { error };

  // Checkbox neposiela "true"/"false" - jeho pritomnost vo formData JE
  // odpoveď (rovnaky vzor ako "featured" pri atributoch objektov).
  const remember = formData.get("remember") != null;

  const user = await prisma.user.findUniqueOrThrow({ where: { email } });
  await createSession(user.id, remember);
  redirect("/");
}

export type VerifySignupState = { error: string | null };

// Bod 2.11/2.12: overenie kodu pri registracii - na rozdiel od
// verifyLoginCode este NEEXISTUJE ziadny User, preto sa az tu (po
// uspesnom overeni) vytvori. "name" prichadza z klienta (skryte pole vo
// formulari, presunute z kroku 1) - bezpecnostne nevadi, kod dokazuje
// vlastnictvo EMAILU, nie mena, ktore je len zobrazovany udaj bez
// pristupovych dosledkov.
export async function verifySignupCode(
  prevState: VerifySignupState,
  formData: FormData
): Promise<VerifySignupState> {
  const locale = await getLocale();
  const t = dictionary[locale];

  const nameRaw = formData.get("name");
  const emailRaw = formData.get("email");
  const codeRaw = formData.get("code");
  const name = typeof nameRaw === "string" ? nameRaw.trim() : "";
  const email = typeof emailRaw === "string" ? emailRaw.trim().toLowerCase() : "";
  const code = typeof codeRaw === "string" ? codeRaw.trim() : "";
  if (!name || !email || !code) return { error: t.auth.enterCodeError };

  const error = await checkAndConsumeCode(email, code);
  if (error) return { error };

  const remember = formData.get("remember") != null;

  let user;
  try {
    user = await prisma.user.create({ data: { name, email } });
  } catch (createError) {
    if (
      createError &&
      typeof createError === "object" &&
      "code" in createError &&
      createError.code === "P2002"
    ) {
      return { error: t.auth.accountExistsError };
    }
    throw createError;
  }
  await createSession(user.id, remember);
  redirect("/");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}

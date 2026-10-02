"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";
import { destroySession } from "@/lib/session";
import { issueCode, checkAndConsumeCode } from "@/lib/verification-code";
import { getLocale } from "@/lib/locale";
import { dictionary } from "@/i18n/dictionary";

export type UpdateNameState = { error: string | null };

// Bod 2.2: premenovanie uctu - jednoduche okamzite ulozenie (bez
// undo/save-session davkovania, rozhodnute v konverzacii - appka vsade
// inde uz uklada okamzite pri kazdom poli, nie je dovod robit uctet inak).
// "getCurrentUser()" (nie hodnota z formulara) urcuje, KTORY ucet sa
// upravuje - klient nikdy nemoze poslat cudzie userId.
export async function updateAccountName(
  prevState: UpdateNameState,
  formData: FormData
): Promise<UpdateNameState> {
  const locale = await getLocale();
  const t = dictionary[locale];
  const user = await getCurrentUser();
  const nameRaw = formData.get("name");
  const name = typeof nameRaw === "string" ? nameRaw.trim() : "";
  if (!name) return { error: t.account.nameRequiredError };

  await prisma.user.update({ where: { id: user.id }, data: { name } });
  return { error: null };
}

export type RequestEmailChangeState = { error: string | null; sent: boolean; email: string };

// Bod 2.2: zmena emailu - najprv sa musi overit VLASTNICTVO NOVEHO emailu
// (rovnaky kodovy mechanizmus ako pri registracii), teda "requestLoginCode"
// tu nejde pouzit (ten by vyzadoval, aby uz ten email existoval - presny
// opak toho, co tu treba).
export async function requestEmailChangeCode(
  prevState: RequestEmailChangeState,
  formData: FormData
): Promise<RequestEmailChangeState> {
  const locale = await getLocale();
  const t = dictionary[locale];
  await getCurrentUser();
  const emailRaw = formData.get("email");
  const email = typeof emailRaw === "string" ? emailRaw.trim().toLowerCase() : "";
  if (!email) return { error: t.account.emailRequiredError, sent: false, email };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: t.account.emailTakenError, sent: false, email };
  }

  if (!(await issueCode(email))) {
    return { error: t.auth.emailSendFailedError, sent: false, email };
  }
  return { error: null, sent: true, email };
}

export type VerifyEmailChangeState = { error: string | null };

export async function verifyEmailChangeCode(
  prevState: VerifyEmailChangeState,
  formData: FormData
): Promise<VerifyEmailChangeState> {
  const locale = await getLocale();
  const t = dictionary[locale];
  const user = await getCurrentUser();
  const emailRaw = formData.get("email");
  const codeRaw = formData.get("code");
  const email = typeof emailRaw === "string" ? emailRaw.trim().toLowerCase() : "";
  const code = typeof codeRaw === "string" ? codeRaw.trim() : "";
  if (!email || !code) return { error: t.account.codeRequiredError };

  const error = await checkAndConsumeCode(email, code);
  if (error) return { error };

  try {
    await prisma.user.update({ where: { id: user.id }, data: { email } });
  } catch (updateError) {
    if (
      updateError &&
      typeof updateError === "object" &&
      "code" in updateError &&
      updateError.code === "P2002"
    ) {
      return { error: t.account.emailTakenError };
    }
    throw updateError;
  }
  redirect("/account");
}

// Bod 2.3: vymazanie uctu (cascaduje aj sheety/kategorie - User@relation
// onDelete: Cascade) - session sa nemusí mazat zvlast, tiez cascaduje.
export async function deleteAccount() {
  const user = await getCurrentUser();
  await prisma.user.delete({ where: { id: user.id } });
  await destroySession();
  redirect("/login");
}

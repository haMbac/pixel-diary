"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { LOCALE_COOKIE } from "@/lib/locale";
import type { Locale } from "@/lib/locale";

export async function setLocale(locale: Locale): Promise<void> {
  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  // "layout" - cely strom Server Components sa nacita znova s novou
  // hodnotou cookie, vratane LocaleProvider, ktory ju posunie dalej aj do
  // Client Components.
  revalidatePath("/", "layout");
}

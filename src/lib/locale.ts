import { cookies } from "next/headers";

export type Locale = "sk" | "en";
export const LOCALE_COOKIE = "pd_locale";
const DEFAULT_LOCALE: Locale = "sk";

// Cita sa priamo (nie cez Context) v kazdom Server Component - lacnejsie
// nez posielat cely dictionary cez props, a Server Components aj tak maju
// priamy pristup ku cookies().
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return value === "en" ? "en" : DEFAULT_LOCALE;
}

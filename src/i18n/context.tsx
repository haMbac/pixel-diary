"use client";

import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import { dictionary } from "./dictionary";
import type { Locale } from "@/lib/locale";

const LocaleContext = createContext<Locale>("sk");

// Nastavene raz v layout.tsx (Server Component, cita cookie cez
// getLocale()) - odtial sa hodnota dostane do vsetkych Client Components
// bez prop-drillingu cez kazdu medzivrstvu.
export function LocaleProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

// "t" (texty) - pouzitie: const t = useT(); ... {t.sheets.legendTitle}
export function useT() {
  const locale = useLocale();
  return dictionary[locale];
}

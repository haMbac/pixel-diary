"use client";

import { useTransition } from "react";
import { useLocale } from "@/i18n/context";
import { setLocale } from "./locale-actions";
import type { Locale } from "@/lib/locale";

// Prepinac jazyka - dve maly vlajky vpravo hore, fixne na kazdej stranke
// (umiestnene priamo v layout.tsx, nie na jednotlivych strankach). z-[5]
// (nie vyssie): nad obsahom stranky, ale pod prilepenou paletou farieb
// sheetu (z-index 6, prekryje ich pri scrollovani) a pod modalnymi oknami.
export function LanguageSwitcher() {
  const locale = useLocale();
  const [pending, startTransition] = useTransition();

  function choose(next: Locale) {
    if (next === locale) return;
    startTransition(() => {
      setLocale(next);
    });
  }

  return (
    <div
      className="fixed top-2 right-2 z-[5] flex items-center gap-1 p-1 rounded-lg print:hidden"
      style={{ backgroundColor: "var(--paper)" }}
    >
      <button
        type="button"
        onClick={() => choose("sk")}
        disabled={pending}
        aria-label="Slovenčina"
        aria-pressed={locale === "sk"}
        title="Slovenčina"
        className="text-lg leading-none p-1 rounded"
        style={{ opacity: locale === "sk" ? 1 : 0.4 }}
      >
        🇸🇰
      </button>
      <button
        type="button"
        onClick={() => choose("en")}
        disabled={pending}
        aria-label="English"
        aria-pressed={locale === "en"}
        title="English"
        className="text-lg leading-none p-1 rounded"
        style={{ opacity: locale === "en" ? 1 : 0.4 }}
      >
        🇬🇧
      </button>
    </div>
  );
}

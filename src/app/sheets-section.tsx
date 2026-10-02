"use client";

import { useRouter } from "next/navigation";
import { useT } from "@/i18n/context";
import { SheetsCarousel } from "./sheets-carousel";
import type { SheetSummary } from "@/lib/sheets";
import type { CreateSheetAction } from "./sheet-actions";

const CARD_BORDER = "var(--border)";

// Klik na vyplnu/ram karty (mimo konkretnej dlazdice) vedie na prvy sheet
// v zozname. Klik na konkretnu dlazdicu vedie na TU dlazdicu (ma vlastny
// stopPropagation, aby sa neaktivoval aj tento onClick). Klik na scroll
// sipky alebo na formular "Nový sheet" (vnutri SheetsCarousel) tiez
// zastavi probublavanie.
export function SheetsSection({
  sheets,
  createSheet,
}: {
  sheets: SheetSummary[];
  createSheet: CreateSheetAction;
}) {
  const router = useRouter();
  const t = useT();

  function goToFirstSheet() {
    if (sheets.length > 0) {
      router.push(`/sheets/${sheets[0].id}`);
    }
  }

  return (
    <section
      onClick={goToFirstSheet}
      style={{
        border: `2px solid ${CARD_BORDER}`,
        borderRadius: 7,
        backgroundColor: "var(--card-fill)",
        cursor: sheets.length > 0 ? "pointer" : "default",
        marginLeft: "auto",
        marginRight: "auto",
        marginBottom: "1.5rem",
      }}
      // "section-width" (definovane v globals.css): 95% vsade, 100% len na
      // telefone na stojato (media query, nedá sa vyjadriť inline stylom).
      className="p-4 section-width"
    >
      <h2 className="text-lg font-medium mb-3 px-1">{t.home.sheetsHeading}</h2>
      <SheetsCarousel sheets={sheets} createSheet={createSheet} />
    </section>
  );
}

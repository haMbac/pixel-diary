"use client";

import { useRouter } from "next/navigation";
import { SheetsCarousel } from "./sheets-carousel";
import type { SheetSummary } from "@/lib/sheets";
import type { CreateSheetAction } from "./sheet-actions";

const CARD_BORDER = "#fbcfe8"; // bledoruzova - docasna, upresni sa neskor

// Cely "blok" Sheets na hlavnej stranke je klikatelny (nie len jednotlive
// miniatury) a vzdy vedie na prvy sheet v zozname. Klik na scroll sipky
// alebo na formular "Nový sheet" (vnutri SheetsCarousel) toto nespusti,
// lebo si tam zastavia probublavanie udalosti (stopPropagation).
export function SheetsSection({
  sheets,
  createSheet,
}: {
  sheets: SheetSummary[];
  createSheet: CreateSheetAction;
}) {
  const router = useRouter();

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
        borderRadius: 20,
        cursor: sheets.length > 0 ? "pointer" : "default",
      }}
      className="p-4 mb-6"
    >
      <h2 className="text-lg font-medium mb-3 px-1">Sheets</h2>
      <SheetsCarousel
        sheets={sheets}
        createSheet={createSheet}
        firstSheetHref={sheets.length > 0 ? `/sheets/${sheets[0].id}` : undefined}
      />
    </section>
  );
}

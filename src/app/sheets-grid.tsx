"use client";

import Link from "next/link";
import type { SheetSummary } from "@/lib/sheets";
import type { CreateSheetAction } from "./sheet-actions";
import {
  SheetThumbnail,
  AddSheetTile,
  THUMB_WIDTH,
  THUMB_HEIGHT,
  PINK_BORDER,
} from "./sheets-carousel";

// "Menu sheetov" (otvara sa z tlacidla ☰ na stranke sheetu, bod 3.11/3.12) -
// na rozdiel od vodorovneho karuselu na hlavnej stranke su tu sheety v
// mriezke (riadky a stlpce, koľko sa ich zmesti do sirky). Ked ich je viac
// nez sa zmesti na vysku, mriezka sa da scrollovat dole (nie do strany).
export function SheetsGrid({
  sheets,
  createSheet,
}: {
  sheets: SheetSummary[];
  createSheet: CreateSheetAction;
}) {
  return (
    <div className="max-h-[70vh] overflow-y-auto pr-1">
      <div
        className="grid gap-3 justify-center"
        style={{ gridTemplateColumns: `repeat(auto-fill, ${THUMB_WIDTH + 24}px)` }}
      >
        {sheets.map((sheet) => (
          <Link
            key={sheet.id}
            href={`/sheets/${sheet.id}`}
            className="flex flex-col items-center justify-center gap-2 hover:shadow-sm transition-shadow p-2"
            style={{
              width: THUMB_WIDTH + 24,
              height: THUMB_HEIGHT + 40,
              borderRadius: 16,
              border: `2px solid ${PINK_BORDER}`,
              background: "#fff",
            }}
          >
            <SheetThumbnail pixels={sheet.pixels} year={sheet.year} />
            <span className="px-2 text-xs text-gray-500 truncate w-full text-center">
              {sheet.name}
            </span>
          </Link>
        ))}

        <AddSheetTile createSheet={createSheet} />
      </div>
    </div>
  );
}

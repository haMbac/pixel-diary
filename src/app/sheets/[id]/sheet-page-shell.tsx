"use client";

import Link from "next/link";
import { useState } from "react";
import type { ReactNode } from "react";
import type { SheetSummary } from "@/lib/sheets";
import type { CreateSheetAction } from "../../sheet-actions";
import { SheetsGrid } from "../../sheets-grid";
import { EditModeProvider } from "./edit-mode-context";

const PINK_BORDER = "#fbcfe8";

// Stranka sheetu podla bodu 3.11 funkcnej specifikacie:
// - vlavo hore sipka spat na hlavnu stranku
// - vpravo hore tlacidlo "✎" prepina edit rezim (cez EditModeContext) -
//   zatial len riadi viditelnost gumy v legende; premenovanie/mazanie
//   sheetu (bod 3.13) este nie je postavene a bude samostatny dalsi krok
// - spodna lista s ikonou PDF exportu (zatial len miesto - bod 3.3) a
//   ikonou "menu sheetov", ktora otvori mriezku vsetkych sheetov (riadky a
//   stlpce, so scrollovanim dole), aby sa dalo prepinat medzi sheetami bez
//   navratu domov
export function SheetPageShell({
  sheetId,
  sheetName,
  sheets,
  createSheet,
  children,
}: {
  sheetId: string;
  sheetName: string;
  sheets: SheetSummary[];
  createSheet: CreateSheetAction;
  children: ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // Predchadzajuci/nasledujuci sheet v tom istom poradi, v akom su
  // zoradene v zozname (a teda aj v mriezke menu ☰).
  const currentIndex = sheets.findIndex((s) => s.id === sheetId);
  const prevSheet = currentIndex > 0 ? sheets[currentIndex - 1] : null;
  const nextSheet =
    currentIndex !== -1 && currentIndex < sheets.length - 1
      ? sheets[currentIndex + 1]
      : null;

  return (
    <main className="mx-auto max-w-xl p-8 pb-24">
      <div className="flex items-center justify-between mb-2">
        <Link
          href="/"
          aria-label="Späť na hlavnú stránku"
          title="Späť na hlavnú stránku"
          className="w-9 h-9 flex items-center justify-center rounded-full border border-pink-200 text-gray-500 hover:bg-pink-50"
        >
          ←
        </Link>
        <button
          type="button"
          onClick={() => setEditMode((v) => !v)}
          aria-pressed={editMode}
          title={editMode ? "Ukončiť úpravu" : "Upraviť"}
          className={
            "w-9 h-9 flex items-center justify-center rounded-full border " +
            (editMode
              ? "bg-pink-100 border-pink-300 text-pink-600"
              : "border-pink-200 text-gray-500 hover:bg-pink-50")
          }
        >
          ✎
        </button>
      </div>

      <h1 className="text-2xl font-semibold mt-2 mb-6">{sheetName}</h1>

      {/* Sipky na predchadzajuci/nasledujuci sheet v zozname - fixed na
          bokoch obrazovky, aby boli dosiahnutelne aj po odscrollovani. */}
      {prevSheet && (
        <Link
          href={`/sheets/${prevSheet.id}`}
          aria-label="Predchádzajúci sheet"
          title={`Predchádzajúci sheet: ${prevSheet.name}`}
          className="fixed left-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white shadow border border-pink-200 text-gray-500 hover:bg-pink-50"
        >
          ‹
        </Link>
      )}
      {nextSheet && (
        <Link
          href={`/sheets/${nextSheet.id}`}
          aria-label="Nasledujúci sheet"
          title={`Nasledujúci sheet: ${nextSheet.name}`}
          className="fixed right-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white shadow border border-pink-200 text-gray-500 hover:bg-pink-50"
        >
          ›
        </Link>
      )}

      <EditModeProvider value={editMode}>{children}</EditModeProvider>

      <div className="fixed bottom-0 left-0 right-0 flex items-center justify-center gap-4 py-3 bg-white border-t border-pink-100">
        <button
          type="button"
          disabled
          title="Export do PDF - čoskoro"
          className="w-10 h-10 flex items-center justify-center rounded-full border border-pink-200 text-gray-300 cursor-not-allowed text-xs"
        >
          PDF
        </button>
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Menu sheetov"
          title="Menu sheetov"
          className="w-10 h-10 flex items-center justify-center rounded-full border border-pink-200 text-gray-500 hover:bg-pink-50"
        >
          ☰
        </button>
      </div>

      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-20"
          onClick={() => setMenuOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ border: `2px solid ${PINK_BORDER}`, borderRadius: 20 }}
            className="bg-white p-4 max-w-lg w-full"
          >
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-lg font-medium">Sheets</h2>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Zavrieť"
                title="Zavrieť"
                className="text-gray-400 hover:text-gray-600 text-sm"
              >
                ✕
              </button>
            </div>
            <SheetsGrid sheets={sheets} createSheet={createSheet} />
          </div>
        </div>
      )}
    </main>
  );
}

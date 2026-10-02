"use client";

import Link from "next/link";
import { useState } from "react";
import type { ReactNode } from "react";
import { useT } from "@/i18n/context";
import type { SheetSummary } from "@/lib/sheets";
import type { CreateSheetAction, ReorderSheetsAction, DeleteSheetAction } from "../../sheet-actions";
import { SheetsGrid } from "../../sheets-grid";
import { EditModeProvider } from "../../edit-mode-context";
import { BackArrowIcon, ChevronLeftIcon, ChevronRightIcon, EditIcon, MenuIcon } from "../../ui-icons";

const PINK_BORDER = "var(--border)";

// Stranka sheetu podla bodu 3.11 funkcnej specifikacie:
// - vlavo hore sipka spat na hlavnu stranku
// - vpravo hore tlacidlo "✎" prepina edit rezim (cez EditModeContext) -
//   riadi viditelnost gumy v legende, premenovanie sheetu (bod 3.13) a
//   zmenu farby v legende (bod 3.21/3.22)
// - spodna lista: sipky na predchadzajuci/nasledujuci sheet, PDF export
//   (bod 3.3, samostatna stranka /print) a ikona "menu sheetov", ktora
//   otvori mriezku vsetkych sheetov (riadky a
//   stlpce, so scrollovanim dole), aby sa dalo prepinat medzi sheetami bez
//   navratu domov - "menu sheetov" ma VLASTNY edit rezim (nezavisly od
//   tohto vyssie), ktory odomkne presuvanie poradia a mazanie sheetov
//   priamo v mriezke (bod: "pridat mazanie do menu cez edit tlacidlo, a
//   presuvanie poradia tiez len v edit rezime")
export function SheetPageShell({
  sheetId,
  sheets,
  createSheet,
  reorderSheets,
  deleteSheet,
  children,
}: {
  sheetId: string;
  sheets: SheetSummary[];
  createSheet: CreateSheetAction;
  reorderSheets: ReorderSheetsAction;
  deleteSheet: DeleteSheetAction;
  children: ReactNode;
}) {
  const t = useT();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [menuEditMode, setMenuEditMode] = useState(false);

  // Predchadzajuci/nasledujuci sheet v tom istom poradi, v akom su
  // zoradene v zozname (a teda aj v mriezke menu ☰).
  const currentIndex = sheets.findIndex((s) => s.id === sheetId);
  const prevSheet = currentIndex > 0 ? sheets[currentIndex - 1] : null;
  const nextSheet =
    currentIndex !== -1 && currentIndex < sheets.length - 1
      ? sheets[currentIndex + 1]
      : null;

  return (
    <main className="mx-auto p-2 sm:p-8 pb-24 sm:pb-24 min-w-0 w-full sheet-page-width">
      <div
        className="flex items-center justify-between mb-2"
        style={{ paddingRight: "var(--lang-switcher-w)" }}
      >
        <Link
          href="/"
          aria-label={t.sheet.backToHomeTitle}
          title={t.sheet.backToHomeTitle}
          className="p-2 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--border-hover)] hover:text-[var(--ink)]"
        >
          <BackArrowIcon />
        </Link>
        <button
          type="button"
          onClick={() => setEditMode((v) => !v)}
          aria-pressed={editMode}
          title={editMode ? t.sheet.endEditTitle : t.sheet.editButtonTitle}
          className={
            "p-2 flex items-center justify-center rounded-lg " +
            (editMode
              ? "bg-[var(--accent-soft)] text-[var(--accent)]"
              : "text-[var(--text-muted)] hover:bg-[var(--border-hover)] hover:text-[var(--ink)]")
          }
        >
          <EditIcon />
        </button>
      </div>

      <EditModeProvider value={editMode}>{children}</EditModeProvider>

      {/* Sipky na predchadzajuci/nasledujuci sheet su v spodnej liste -
          predtym boli fixne v strede okrajov obrazovky a lezali priamo nad
          okrajom mriezky (klik do bunky pod nimi prepol sheet). Prazdne
          miesto namiesto chybajucej sipky drzi PDF a ☰ stale v strede. */}
      <div className="bottom-bar">
        {prevSheet ? (
          <Link
            href={`/sheets/${prevSheet.id}`}
            aria-label={t.sheet.prevSheetAriaLabel}
            title={t.sheet.prevSheetTitle(prevSheet.name)}
            className="p-2 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--border-hover)] hover:text-[var(--ink)]"
          >
            <ChevronLeftIcon />
          </Link>
        ) : (
          <span className="w-[38px]" aria-hidden="true" />
        )}
        <Link
          href={`/sheets/${sheetId}/print`}
          aria-label={t.sheet.pdfExportTitle}
          title={t.sheet.pdfExportTitle}
          className="w-10 h-10 flex items-center justify-center rounded-full border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--border-hover)] hover:text-[var(--ink)] text-xs"
        >
          {t.sheet.pdfButtonLabel}
        </Link>
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label={t.sheet.sheetsMenuTitle}
          title={t.sheet.sheetsMenuTitle}
          className="p-2 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--border-hover)] hover:text-[var(--ink)]"
        >
          <MenuIcon />
        </button>
        {nextSheet ? (
          <Link
            href={`/sheets/${nextSheet.id}`}
            aria-label={t.sheet.nextSheetAriaLabel}
            title={t.sheet.nextSheetTitle(nextSheet.name)}
            className="p-2 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--border-hover)] hover:text-[var(--ink)]"
          >
            <ChevronRightIcon />
          </Link>
        ) : (
          <span className="w-[38px]" aria-hidden="true" />
        )}
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
              <h2 className="text-lg font-medium">{t.sheet.sheetsMenuHeading}</h2>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setMenuEditMode((v) => !v)}
                  aria-pressed={menuEditMode}
                  title={menuEditMode ? t.sheet.endEditTitle : t.sheet.editMenuButtonTitle}
                  className={
                    "p-1.5 flex items-center justify-center rounded-lg " +
                    (menuEditMode
                      ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                      : "text-[var(--text-muted)] hover:bg-[var(--border-hover)] hover:text-[var(--ink)]")
                  }
                >
                  <EditIcon size={20} />
                </button>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  aria-label={t.sheet.closeAriaLabel}
                  title={t.sheet.closeAriaLabel}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none p-1"
                >
                  ✕
                </button>
              </div>
            </div>
            <SheetsGrid
              sheets={sheets}
              createSheet={createSheet}
              reorderSheets={reorderSheets}
              deleteSheet={deleteSheet}
              editMode={menuEditMode}
              currentSheetId={sheetId}
            />
          </div>
        </div>
      )}
    </main>
  );
}

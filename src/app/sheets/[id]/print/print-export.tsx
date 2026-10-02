"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { effectiveYear } from "@/lib/calendar";
import type { SheetView } from "@/lib/sheet-view";
import { useT } from "@/i18n/context";
import { BackArrowIcon } from "../../../ui-icons";
import { a4Size, readPageFonts, renderPage } from "./page-render";
import { canvasToPdf, downloadBlob } from "./pdf";
import {
  BLOCK_IDS,
  PrintSheet,
  defaultBlocks,
  type BlockLayout,
  type PageData,
  type PrintContent,
  type PrintLayout,
  type PrintPixel,
  type PrintValue,
} from "./print-sheet";

const LANDSCAPE_QUERY = "(orientation: landscape)";
// 300 dpi = ostra tlac aj drobneho textu (A4 na sirku ~ 3508 x 2480 px).
const PDF_DPI = 300;

// Rozlozenie blokov si pamata tento prehliadac (nie DB) - zvlast pre kazde
// zobrazenie, lebo kazde ma inu orientaciu a tvar mriezky.
const BLOCKS_STORAGE_PREFIX = "pd_pdf_blocks_v1:";
const PRINT_LAYOUTS: PrintLayout[] = ["columns", "rows", "calendar"];

function isBlockLayout(value: unknown): value is BlockLayout {
  if (!value || typeof value !== "object") return false;
  return BLOCK_IDS.every((id) => {
    const rect = (value as Record<string, unknown>)[id] as Record<string, unknown> | undefined;
    return rect != null && ["x", "y", "w", "h"].every((k) => typeof rect[k] === "number" && Number.isFinite(rect[k]));
  });
}

function loadSavedBlocks(): Partial<Record<PrintLayout, BlockLayout>> {
  const saved: Partial<Record<PrintLayout, BlockLayout>> = {};
  for (const layout of PRINT_LAYOUTS) {
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem(BLOCKS_STORAGE_PREFIX + layout) ?? "null");
      if (isBlockLayout(parsed)) saved[layout] = parsed;
    } catch {
      // Sukromne okno / zablokovane uloziste - zostane predvolene rozlozenie.
    }
  }
  return saved;
}

function storeBlocks(layout: PrintLayout, blocks: BlockLayout | null): void {
  try {
    if (blocks) localStorage.setItem(BLOCKS_STORAGE_PREFIX + layout, JSON.stringify(blocks));
    else localStorage.removeItem(BLOCKS_STORAGE_PREFIX + layout);
  } catch {
    // Neulozene - rozlozenie plati aspon do zatvorenia stranky.
  }
}

function subscribeToOrientation(onChange: () => void): () => void {
  const query = window.matchMedia(LANDSCAPE_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

// Ulozene zobrazenie "auto" sa tu (rovnako ako na stranke sheetu) riadi
// orientaciou obrazovky. Server ju nepozna - pocas prveho vykreslenia sa
// berie "na vysku", useSyncExternalStore potom bez chyby hydratacie prepne.
function useIsLandscape(): boolean {
  return useSyncExternalStore(
    subscribeToOrientation,
    () => window.matchMedia(LANDSCAPE_QUERY).matches,
    () => false
  );
}

export function PrintExport({
  sheetId,
  name,
  year,
  values,
  pixels,
  savedView,
}: {
  sheetId: string;
  name: string;
  year: number | null;
  values: PrintValue[];
  pixels: PrintPixel[];
  savedView: SheetView;
}) {
  const t = useT();
  const isLandscape = useIsLandscape();
  const [pickedLayout, setPickedLayout] = useState<PrintLayout | null>(null);
  const [content, setContent] = useState<PrintContent>("filled");
  const [showLegend, setShowLegend] = useState(true);
  const [showWeekends, setShowWeekends] = useState(true);
  const [showNotes, setShowNotes] = useState(true);

  const layout: PrintLayout =
    pickedLayout ?? (savedView !== "auto" ? savedView : isLandscape ? "rows" : "columns");

  // Ulozene rozlozenie sa nacita az po hydratacii - server localStorage
  // nevidi a prve vykreslenie musi byt na oboch stranach rovnake.
  const [savedBlocks, setSavedBlocks] = useState<Partial<Record<PrintLayout, BlockLayout>>>({});
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSavedBlocks(loadSavedBlocks());
  }, []);
  const blocks = savedBlocks[layout] ?? defaultBlocks(layout);
  function changeBlocks(next: BlockLayout) {
    setSavedBlocks((current) => ({ ...current, [layout]: next }));
    storeBlocks(layout, next);
  }
  function resetBlocks() {
    setSavedBlocks((current) => {
      const next = { ...current };
      delete next[layout];
      return next;
    });
    storeBlocks(layout, null);
  }
  // Mesiace v riadkoch su siroke - jedine zobrazenie na A4 na sirku.
  const orientation = layout === "rows" ? "landscape" : "portrait";

  const pageData = useMemo<PageData>(
    () => ({
      layout,
      content,
      showLegend,
      showWeekends,
      showNotes,
      name,
      year,
      calendarYear: effectiveYear(year),
      values,
      pixels,
      monthNames: [
        t.sheet.monthJan, t.sheet.monthFeb, t.sheet.monthMar, t.sheet.monthApr,
        t.sheet.monthMay, t.sheet.monthJun, t.sheet.monthJul, t.sheet.monthAug,
        t.sheet.monthSep, t.sheet.monthOct, t.sheet.monthNov, t.sheet.monthDec,
      ],
      weekdayNames: [
        t.sheet.weekdayMon, t.sheet.weekdayTue, t.sheet.weekdayWed, t.sheet.weekdayThu,
        t.sheet.weekdayFri, t.sheet.weekdaySat, t.sheet.weekdaySun,
      ],
      legendHeading: t.pdfExport.legendHeading,
      notesHeading: t.pdfExport.notesHeading,
    }),
    [layout, content, showLegend, showWeekends, showNotes, name, year, values, pixels, t]
  );

  // PDF sa vytvori priamo v prehliadaci a stiahne ako subor - ziadny
  // tlacovy dialog (ten sa v Safari spraval inak nez v Chrome). Strana sa
  // nakresli tym istym kodom ako nahlad, len v rozliseni 300 dpi.
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  async function savePdf() {
    setSaving(true);
    setSaveError(false);
    try {
      await document.fonts.ready;
      const size = a4Size(layout);
      const pxPerMm = PDF_DPI / 25.4;
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(size.w * pxPerMm);
      canvas.height = Math.round(size.h * pxPerMm);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas unavailable");
      renderPage(ctx, size.w, size.h, pxPerMm, pageData, blocks, readPageFonts());
      const title = year != null ? `${name} ${year}` : name;
      const pdf = await canvasToPdf(canvas, size.w, size.h, title);
      downloadBlob(pdf, `${title.replace(/[\\/:*?"<>|]+/g, "-").trim() || "pixel-diar"}.pdf`);
    } catch (error) {
      console.error(error);
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="print-page sheet-page-width mx-auto p-4 sm:p-8 w-full">
      <div className="print-controls">
        <div className="flex items-center gap-2 mb-4" style={{ paddingRight: "var(--lang-switcher-w)" }}>
          <Link
            href={`/sheets/${sheetId}`}
            aria-label={t.pdfExport.backToSheet}
            title={t.pdfExport.backToSheet}
            className="p-2 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--border-hover)] hover:text-[var(--ink)]"
          >
            <BackArrowIcon size={22} />
          </Link>
          <h1>{t.pdfExport.pageTitle}</h1>
        </div>

        <div className="flex flex-col gap-4">
          <OptionGroup
            label={t.pdfExport.layoutLabel}
            value={layout}
            onChange={setPickedLayout}
            options={[
              { value: "columns", label: t.sheet.viewColumns },
              { value: "rows", label: t.sheet.viewRows },
              { value: "calendar", label: t.sheet.viewCalendar },
            ]}
          />
          <OptionGroup
            label={t.pdfExport.contentLabel}
            value={content}
            onChange={setContent}
            options={[
              { value: "filled", label: t.pdfExport.contentFilled },
              { value: "empty", label: t.pdfExport.contentEmpty },
            ]}
          />
          <div>
            <div className="text-sm font-medium mb-1.5">{t.pdfExport.includeLabel}</div>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              <Toggle checked={showLegend} onChange={setShowLegend} label={t.pdfExport.legendToggle} />
              <Toggle checked={showWeekends} onChange={setShowWeekends} label={t.pdfExport.weekendsToggle} />
              <Toggle checked={showNotes} onChange={setShowNotes} label={t.pdfExport.notesToggle} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap mt-5">
          <button
            type="button"
            onClick={savePdf}
            disabled={saving}
            className="bg-black text-white rounded px-4 py-2 disabled:opacity-60"
          >
            {saving ? t.pdfExport.savingButton : t.pdfExport.saveButton}
          </button>
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>
            {orientation === "portrait" ? t.pdfExport.paperPortrait : t.pdfExport.paperLandscape}
          </span>
        </div>
        {saveError && <p className="text-red-600 text-sm mt-2">{t.pdfExport.saveFailedError}</p>}
        <div className="flex items-center gap-3 flex-wrap mt-3 mb-6">
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {t.pdfExport.blocksHint}
          </p>
          <button
            type="button"
            onClick={resetBlocks}
            disabled={savedBlocks[layout] == null}
            className="text-xs px-2 py-1 rounded border disabled:opacity-40"
            style={{ borderColor: "var(--border)" }}
          >
            {t.pdfExport.resetLayoutButton}
          </button>
        </div>
      </div>

      <div className="print-preview">
        <PrintSheet data={pageData} blocks={blocks} onBlocksChange={changeBlocks} />
      </div>
    </main>
  );
}

function OptionGroup<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div>
      <div className="text-sm font-medium mb-1.5">{label}</div>
      <div
        role="group"
        aria-label={label}
        className="inline-flex flex-wrap gap-0.5 p-0.5 rounded-lg"
        style={{ border: "1px solid var(--border)", backgroundColor: "var(--card-fill)" }}
      >
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
            className={
              "px-3 py-1.5 text-sm rounded-md " +
              (value === option.value
                ? "bg-[var(--accent-soft)] text-[var(--accent)] font-medium"
                : "text-[var(--text-muted)] hover:bg-[var(--border-hover)] hover:text-[var(--ink)]")
            }
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

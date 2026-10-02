"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { daysInMonth } from "@/lib/calendar";
import type { SheetSummary } from "@/lib/sheets";
import type { CreateSheetAction } from "./sheet-actions";
import { ChevronLeftIcon, ChevronRightIcon } from "./ui-icons";
import { useT } from "@/i18n/context";

type PixelDot = SheetSummary["pixels"][number];

// Velkost jednej bunky v miniature - MUSI byt stvorec (rovnaka sirka aj
// vyska), presne ako v realnej mriezke. Vdaka tomu ma cela miniatura
// spravne "vysoky, uzky" tvar (12 stlpcov x 31 riadkov), nie skreslenu
// nasilne-stvorcovu podobu.
const THUMB_CELL = 6;
export const THUMB_WIDTH = THUMB_CELL * 12;
export const THUMB_HEIGHT = THUMB_CELL * 31;

export function SheetThumbnail({
  pixels,
  year,
}: {
  pixels: PixelDot[];
  year: number | null;
}) {
  function colorAt(month: number, day: number): string | null {
    return pixels.find((p) => p.month === month && p.day === day)?.color ?? null;
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(12, ${THUMB_CELL}px)`,
        gridTemplateRows: `repeat(31, ${THUMB_CELL}px)`,
        width: THUMB_WIDTH,
        height: THUMB_HEIGHT,
      }}
    >
      {Array.from({ length: 31 }, (_, dayIdx) =>
        Array.from({ length: 12 }, (_, monthIdx) => {
          const day = dayIdx + 1;
          const month = monthIdx + 1;

          // Neexistujuci den (napr. 30. februar) - vobec nevykreslime
          // (splynie s bielym pozadim karty), nie je to "prazdny den".
          if (day > daysInMonth(year, month)) {
            return <div key={`${month}-${day}`} style={{ backgroundColor: "transparent" }} />;
          }

          const color = colorAt(month, day);
          return (
            <div
              key={`${month}-${day}`}
              style={{ backgroundColor: color ?? "#f3f4f6" }}
            />
          );
        })
      )}
    </div>
  );
}
export const PINK_BORDER = "var(--border)";

export function SheetsCarousel({
  sheets,
  createSheet,
}: {
  sheets: SheetSummary[];
  createSheet: CreateSheetAction;
}) {
  const t = useT();
  const scrollRef = useRef<HTMLDivElement>(null);
  // Sipky sa ukazu len ked sa vsetky dlazdice do riadku nezmestia (obsah je
  // sirsi ako kontajner) - nie proste vzdy, ked existuje aspon 1 sheet.
  // ResizeObserver prepocita pri kazdej zmene velkosti okna aj pri zmene
  // poctu sheetov.
  const [canScroll, setCanScroll] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    function checkOverflow() {
      if (!el) return;
      setCanScroll(el.scrollWidth > el.clientWidth + 1);
    }

    checkOverflow();
    const observer = new ResizeObserver(checkOverflow);
    observer.observe(el);
    return () => observer.disconnect();
  }, [sheets.length]);

  function scroll(direction: 1 | -1) {
    scrollRef.current?.scrollBy({ left: direction * 260, behavior: "smooth" });
  }

  return (
    <div className="relative">
      {canScroll && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            scroll(-1);
          }}
          aria-label={t.sheetsBrowse.prevArrowLabel}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 p-1 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--ink)]"
        >
          <ChevronLeftIcon />
        </button>
      )}

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scroll-smooth py-1"
        style={{ scrollbarWidth: "none" }}
      >
        {sheets.map((sheet) => (
          <Link
            key={sheet.id}
            href={`/sheets/${sheet.id}`}
            onClick={(e) => e.stopPropagation()}
            className="shrink-0 flex flex-col items-center justify-center gap-2 hover:shadow-sm transition-shadow p-2"
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

      {canScroll && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            scroll(1);
          }}
          aria-label={t.sheetsBrowse.nextArrowLabel}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 p-1 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--ink)]"
        >
          <ChevronRightIcon />
        </button>
      )}
    </div>
  );
}

// Bod 3.12: klik na poslednu polozku "+" (na hlavnej stranke aj v "menu
// sheetov") otvori OKNO (modal) na vytvorenie noveho sheetu - dlazdica sama
// je len tlacidlo, formular je az v prekryvnom okne.
export function AddSheetTile({ createSheet }: { createSheet: CreateSheetAction }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createSheet, {
    error: null,
  });

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        style={{
          width: THUMB_WIDTH + 24,
          height: THUMB_HEIGHT + 40,
          borderRadius: 16,
          border: `2px dashed ${PINK_BORDER}`,
          color: "var(--accent)",
        }}
        className="shrink-0 flex flex-col items-center justify-center gap-1 p-2"
      >
        <span className="text-3xl leading-none">+</span>
        <span className="text-xs text-gray-400">{t.sheetsBrowse.newSheetTileLabel}</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-30"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ border: `2px solid ${PINK_BORDER}`, borderRadius: 20 }}
            className="bg-white p-6 max-w-sm w-full"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">{t.sheetsBrowse.newSheetModalTitle}</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t.sheetsBrowse.closeButtonLabel}
                title={t.sheetsBrowse.closeButtonLabel}
                className="text-gray-400 hover:text-gray-600 text-sm"
              >
                ✕
              </button>
            </div>
            <form action={formAction} className="flex flex-col gap-3">
              <label className="text-sm text-gray-600">
                {t.sheetsBrowse.nameFieldLabel}
                <input
                  type="text"
                  name="name"
                  placeholder={t.sheetsBrowse.nameFieldPlaceholder}
                  className="mt-1 w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]"
                />
              </label>
              <label className="text-sm text-gray-600">
                {t.sheetsBrowse.yearFieldLabel}
                <input
                  type="number"
                  name="year"
                  placeholder={t.sheetsBrowse.yearFieldPlaceholder}
                  defaultValue={new Date().getFullYear()}
                  className="mt-1 w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]"
                />
              </label>
              {state.error && <p className="text-red-600 text-sm">{state.error}</p>}
              <button
                type="submit"
                disabled={isPending}
                className="bg-black text-white rounded px-4 py-2 text-sm disabled:opacity-50 mt-2"
              >
                {isPending ? t.sheetsBrowse.creatingButtonLabel : t.sheetsBrowse.createButtonLabel}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

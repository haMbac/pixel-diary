"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { daysInMonth } from "@/lib/calendar";
import type { SheetSummary } from "@/lib/sheets";
import type { CreateSheetAction } from "./sheet-actions";

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
export const PINK_BORDER = "#fbcfe8"; // Tailwind pink-200 - docasna farba, upresni sa neskor

export function SheetsCarousel({
  sheets,
  createSheet,
  firstSheetHref,
}: {
  sheets: SheetSummary[];
  createSheet: CreateSheetAction;
  // Nepovinne: ked je zadane, KAZDA miniatura vedie na tuto (rovnaku)
  // adresu namiesto na svoj vlastny sheet. Pouziva sa na hlavnej stranke -
  // cely "blok" s miniaturami tak funguje ako jeden vstup vzdy na prvy
  // sheet v zozname (presna URL sa pocita na serveri, lebo funkcie sa
  // nedaju posielat zo Server do Client Componentu). V "menu sheetov" sa
  // nezadava - tam kazda miniatura vedie na svoj vlastny sheet.
  firstSheetHref?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  function scroll(direction: 1 | -1) {
    scrollRef.current?.scrollBy({ left: direction * 260, behavior: "smooth" });
  }

  return (
    <div className="relative">
      {sheets.length > 0 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            scroll(-1);
          }}
          aria-label="Predchádzajúce sheety"
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 bg-white shadow rounded-full w-8 h-8 flex items-center justify-center text-gray-500"
        >
          ‹
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
            href={firstSheetHref ?? `/sheets/${sheet.id}`}
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

      {sheets.length > 0 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            scroll(1);
          }}
          aria-label="Ďalšie sheety"
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 bg-white shadow rounded-full w-8 h-8 flex items-center justify-center text-gray-500"
        >
          ›
        </button>
      )}
    </div>
  );
}

// Bod 3.12: klik na poslednu polozku "+" (na hlavnej stranke aj v "menu
// sheetov") otvori OKNO (modal) na vytvorenie noveho sheetu - dlazdica sama
// je len tlacidlo, formular je az v prekryvnom okne.
export function AddSheetTile({ createSheet }: { createSheet: CreateSheetAction }) {
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
        }}
        className="shrink-0 flex flex-col items-center justify-center gap-1 p-2 text-pink-400"
      >
        <span className="text-3xl leading-none">+</span>
        <span className="text-xs text-gray-400">Nový sheet</span>
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
              <h2 className="text-lg font-medium">Nový sheet</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Zavrieť"
                title="Zavrieť"
                className="text-gray-400 hover:text-gray-600 text-sm"
              >
                ✕
              </button>
            </div>
            <form action={formAction} className="flex flex-col gap-3">
              <label className="text-sm text-gray-600">
                Názov
                <input
                  type="text"
                  name="name"
                  placeholder="napr. Nálady 2027"
                  className="mt-1 w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-pink-300"
                />
              </label>
              <label className="text-sm text-gray-600">
                Rok (nepovinné)
                <input
                  type="number"
                  name="year"
                  placeholder="napr. 2027"
                  defaultValue={new Date().getFullYear()}
                  className="mt-1 w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-pink-300"
                />
              </label>
              {state.error && <p className="text-red-600 text-sm">{state.error}</p>}
              <button
                type="submit"
                disabled={isPending}
                className="bg-black text-white rounded px-4 py-2 text-sm disabled:opacity-50 mt-2"
              >
                {isPending ? "Vytváram…" : "Create"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

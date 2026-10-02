"use client";

import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent, RefObject } from "react";
import {
  readPageFonts,
  renderPage,
  type BlockId,
  type BlockLayout,
  type BlockRect,
  type PageData,
  type PrintLayout,
} from "./page-render";

export type { BlockLayout, PageData, PrintContent, PrintLayout, PrintPixel, PrintValue } from "./page-render";

export const BLOCK_IDS: BlockId[] = ["title", "grid", "legend", "notes"];

// Strana v nahlade (a pre presuvanie blokov) - o 1 mm nizsia nez A4, bloky
// sa tak do ulozeneho PDF (presne A4) vzdy zmestia.
export function pageSize(layout: PrintLayout): { w: number; h: number } {
  return layout === "rows" ? { w: 297, h: 209 } : { w: 210, h: 296 };
}

// Predvolene rozlozenie (aj po "Obnovit rozlozenie") - vsetko v nasobkoch
// 5 mm, rovnako ako prichytavanie pri tahani.
export function defaultBlocks(layout: PrintLayout): BlockLayout {
  if (layout === "rows") {
    return {
      title: { x: 10, y: 10, w: 275, h: 10 },
      grid: { x: 10, y: 25, w: 275, h: 110 },
      legend: { x: 10, y: 140, w: 130, h: 55 },
      notes: { x: 145, y: 140, w: 140, h: 55 },
    };
  }
  if (layout === "columns") {
    return {
      title: { x: 10, y: 10, w: 190, h: 10 },
      grid: { x: 10, y: 25, w: 110, h: 260 },
      legend: { x: 130, y: 25, w: 70, h: 70 },
      notes: { x: 130, y: 100, w: 70, h: 185 },
    };
  }
  return {
    title: { x: 10, y: 10, w: 190, h: 10 },
    grid: { x: 10, y: 25, w: 190, h: 200 },
    legend: { x: 10, y: 230, w: 90, h: 55 },
    notes: { x: 105, y: 230, w: 95, h: 55 },
  };
}

const SNAP_MM = 5;
// Tlaciarne okraj papiera neprintnu - bloky sa k nemu nepriblizia viac.
const PAGE_MARGIN_MM = 5;
const MIN_BLOCK_W_MM = 20;
const MIN_BLOCK_H_MM = 10;

function snap(value: number): number {
  return Math.round(value / SNAP_MM) * SNAP_MM;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

function movedRect(rect: BlockRect, dx: number, dy: number, page: { w: number; h: number }): BlockRect {
  return {
    ...rect,
    x: clamp(snap(rect.x + dx), PAGE_MARGIN_MM, page.w - PAGE_MARGIN_MM - rect.w),
    y: clamp(snap(rect.y + dy), PAGE_MARGIN_MM, page.h - PAGE_MARGIN_MM - rect.h),
  };
}

function resizedRect(rect: BlockRect, dx: number, dy: number, page: { w: number; h: number }): BlockRect {
  return {
    ...rect,
    w: clamp(snap(rect.w + dx), MIN_BLOCK_W_MM, page.w - PAGE_MARGIN_MM - rect.x),
    h: clamp(snap(rect.h + dy), MIN_BLOCK_H_MM, page.h - PAGE_MARGIN_MM - rect.y),
  };
}

// Priehladny ram jedneho bloku nad nakreslenou stranou - tahanim za plochu
// sa blok presuva, za roh vpravo dole sa meni jeho velkost. Obsah bloku
// kresli canvas pod nim.
function BlockFrame({
  rect,
  page,
  paperRef,
  onChange,
}: {
  rect: BlockRect;
  page: { w: number; h: number };
  paperRef: RefObject<HTMLDivElement | null>;
  onChange: (rect: BlockRect) => void;
}) {
  function startPointer(e: ReactPointerEvent<HTMLElement>, mode: "move" | "resize") {
    const paper = paperRef.current;
    if (!paper || e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    // Nahlad je zmensena strana - posun mysi v px prepocitame na mm papiera.
    const mmPerPx = page.w / paper.getBoundingClientRect().width;
    const startX = e.clientX;
    const startY = e.clientY;
    const startRect = rect;

    function handleMove(ev: PointerEvent) {
      const dx = (ev.clientX - startX) * mmPerPx;
      const dy = (ev.clientY - startY) * mmPerPx;
      onChange(mode === "move" ? movedRect(startRect, dx, dy, page) : resizedRect(startRect, dx, dy, page));
    }
    function handleUp() {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
    }
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);
  }

  return (
    <div
      className="paper-block paper-block--editable"
      style={{
        left: `calc(var(--u) * ${rect.x})`,
        top: `calc(var(--u) * ${rect.y})`,
        width: `calc(var(--u) * ${rect.w})`,
        height: `calc(var(--u) * ${rect.h})`,
      }}
      onPointerDown={(e) => startPointer(e, "move")}
    >
      <span className="paper-block-handle" aria-hidden="true" onPointerDown={(e) => startPointer(e, "resize")} />
    </div>
  );
}

// Nahlad strany A4: nakreslena stranka (rovnakym kodom ako ulozene PDF) +
// ramy blokov na presuvanie. Rozmery su v "mm" cez CSS premennu --u
// (globals.css .paper) odvodenu od sirky stranky.
export function PrintSheet({
  data,
  blocks,
  onBlocksChange,
}: {
  data: PageData;
  blocks: BlockLayout;
  onBlocksChange: (blocks: BlockLayout) => void;
}) {
  const paperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const page = pageSize(data.layout);
  const landscape = data.layout === "rows";

  // Ked dokoncia nacitanie fontov (pixelovy nadpis, IBM Plex), strana sa
  // prekresli - inak by prve vykreslenie mohlo zostat v nahradnom fonte.
  const [fontsReady, setFontsReady] = useState(0);
  useEffect(() => {
    let active = true;
    document.fonts.ready.then(() => {
      if (active) setFontsReady((n) => n + 1);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const paper = paperRef.current;
    if (!canvas || !paper) return;
    const draw = () => {
      const { width, height } = paper.getBoundingClientRect();
      if (!width) return;
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      const ctx = canvas.getContext("2d");
      if (ctx) renderPage(ctx, page.w, page.h, canvas.width / page.w, data, blocks, readPageFonts());
    };
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(paper);
    return () => observer.disconnect();
  }, [data, blocks, page.w, page.h, fontsReady]);

  const visibleBlocks = BLOCK_IDS.filter(
    (id) =>
      (id !== "legend" || (data.showLegend && (data.content === "empty" || data.values.length > 0))) &&
      (id !== "notes" || data.showNotes)
  );

  return (
    <div className={`paper-frame${landscape ? " paper-frame--landscape" : ""}`}>
      <div ref={paperRef} className={`paper${landscape ? " paper--landscape" : ""}`}>
        <canvas ref={canvasRef} className="paper-canvas" aria-hidden="true" />
        {visibleBlocks.map((id) => (
          <BlockFrame
            key={id}
            rect={blocks[id]}
            page={page}
            paperRef={paperRef}
            onChange={(rect) => onBlocksChange({ ...blocks, [id]: rect })}
          />
        ))}
      </div>
    </div>
  );
}

import { daysInMonth, isWeekend, monthWeeks } from "@/lib/calendar";
import { isDarkColor } from "@/lib/color";

// Kreslenie celej strany A4 (nadpis, mriezka, legenda, poznamky) na canvas -
// jedina implementacia pre nahlad na obrazovke aj pre ulozene PDF, takze sa
// nemozu rozist. Vsetky rozmery su v mm; "pxPerMm" urcuje rozlisenie.

export type PrintLayout = "columns" | "rows" | "calendar";
export type PrintContent = "filled" | "empty";
export type PrintValue = { id: string; name: string; color: string };
export type PrintPixel = { month: number; day: number; valueId: string | null };

export type BlockId = "title" | "grid" | "legend" | "notes";
export type BlockRect = { x: number; y: number; w: number; h: number };
export type BlockLayout = Record<BlockId, BlockRect>;

export type PageData = {
  layout: PrintLayout;
  content: PrintContent;
  showLegend: boolean;
  showWeekends: boolean;
  showNotes: boolean;
  name: string;
  year: number | null;
  calendarYear: number;
  values: PrintValue[];
  pixels: PrintPixel[];
  monthNames: string[];
  weekdayNames: string[];
  legendHeading: string;
  notesHeading: string;
};

export type PageFonts = { pixel: string; sans: string };

// Mena fontov tak, ako ich nacital next/font (CSS premenne na <html>) -
// canvas potrebuje skutocne mena rodin, nie CSS premenne.
export function readPageFonts(): PageFonts {
  const styles = getComputedStyle(document.documentElement);
  return {
    pixel: styles.getPropertyValue("--font-pixel").trim() || "monospace",
    sans: styles.getPropertyValue("--font-plex-sans").trim() || "sans-serif",
  };
}

// Skutocne A4 (pre PDF) - nahlad a presuvanie blokov pocitaju s o 1 mm
// nizsou stranou, bloky sa teda do A4 vzdy zmestia.
export function a4Size(layout: PrintLayout): { w: number; h: number } {
  return layout === "rows" ? { w: 297, h: 210 } : { w: 210, h: 297 };
}

// Jednotky mriezky (rovnake ako doterajsi SVG nahlad) - mriezka sa potom
// zmensi/zvacsi, aby sa zmestila do svojho bloku.
const CELL = 10;
const GAP = 1.6;
const STEP = CELL + GAP;
const RADIUS = 1.2;
const CELL_STROKE = "#bdbdbd";
const LABEL_FILL = "#6b6b66";
const WEEKEND_FILL = "#ecebe6";
const EMPTY_FILL = "#ffffff";
const BLANK_LEGEND_ROWS_WITH_VALUES = 2;
const BLANK_LEGEND_ROWS_WITHOUT_VALUES = 4;

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

type Shape =
  | { kind: "cell"; x: number; y: number; fill: string }
  | { kind: "missing"; x: number; y: number }
  | {
      kind: "text";
      x: number;
      y: number;
      text: string;
      size: number;
      align: CanvasTextAlign;
      fill: string;
      weight?: number;
      // "middle" = vertikalne vycentrovane na y (v SVG nahlade dy="0.35em").
      middle?: boolean;
    };

type Drawing = { width: number; height: number; shapes: Shape[] };
type CellFill = (month: number, day: number) => { fill: string; dark: boolean };

function gridColumns(year: number, monthNames: string[], cellFill: CellFill): Drawing {
  const labelW = 12;
  const headerH = 9;
  const x = (month: number) => labelW + (month - 1) * STEP;
  const y = (day: number) => headerH + (day - 1) * STEP;
  const shapes: Shape[] = [];
  for (const month of MONTHS) {
    shapes.push({ kind: "text", x: x(month) + CELL / 2, y: headerH - 2.6, text: monthNames[month - 1], size: 4.4, align: "center", fill: LABEL_FILL });
  }
  for (const day of DAYS) {
    shapes.push({ kind: "text", x: labelW - 2.4, y: y(day) + CELL / 2, text: String(day), size: 4, align: "right", fill: LABEL_FILL, middle: true });
    for (const month of MONTHS) {
      shapes.push(
        day > daysInMonth(year, month)
          ? { kind: "missing", x: x(month), y: y(day) }
          : { kind: "cell", x: x(month), y: y(day), fill: cellFill(month, day).fill }
      );
    }
  }
  return { width: labelW + 12 * CELL + 11 * GAP, height: headerH + 31 * CELL + 30 * GAP, shapes };
}

function gridRows(year: number, monthNames: string[], cellFill: CellFill): Drawing {
  const labelW = 16;
  const headerH = 8;
  const x = (day: number) => labelW + (day - 1) * STEP;
  const y = (month: number) => headerH + (month - 1) * STEP;
  const shapes: Shape[] = [];
  for (const day of DAYS) {
    shapes.push({ kind: "text", x: x(day) + CELL / 2, y: headerH - 2.4, text: String(day), size: 4, align: "center", fill: LABEL_FILL });
  }
  for (const month of MONTHS) {
    shapes.push({ kind: "text", x: labelW - 2.4, y: y(month) + CELL / 2, text: monthNames[month - 1], size: 4.4, align: "right", fill: LABEL_FILL, middle: true });
    for (const day of DAYS) {
      shapes.push(
        day > daysInMonth(year, month)
          ? { kind: "missing", x: x(day), y: y(month) }
          : { kind: "cell", x: x(day), y: y(month), fill: cellFill(month, day).fill }
      );
    }
  }
  return { width: labelW + 31 * CELL + 30 * GAP, height: headerH + 12 * CELL + 11 * GAP, shapes };
}

// Kalendar na A4 na vysku: 3 mesiace vedla seba x 4 riadky, vzdy 6 tyzdnov.
function gridCalendar(year: number, monthNames: string[], weekdayNames: string[], cellFill: CellFill): Drawing {
  const columns = 3;
  const titleH = 8;
  const weekdayH = 6;
  const blockW = 7 * CELL + 6 * GAP;
  const blockH = titleH + weekdayH + 6 * CELL + 5 * GAP;
  const gapX = 8;
  const gapY = 6;
  const shapes: Shape[] = [];
  for (const month of MONTHS) {
    const bx = ((month - 1) % columns) * (blockW + gapX);
    const by = Math.floor((month - 1) / columns) * (blockH + gapY);
    shapes.push({ kind: "text", x: bx + 0.5, y: by + titleH - 2.4, text: monthNames[month - 1], size: 5.2, align: "left", fill: "#1f1f1f", weight: 600 });
    weekdayNames.forEach((name, weekday) => {
      shapes.push({ kind: "text", x: bx + weekday * STEP + CELL / 2, y: by + titleH + weekdayH - 1.8, text: name, size: 3.6, align: "center", fill: LABEL_FILL });
    });
    monthWeeks(year, month).forEach((week, weekIndex) =>
      week.forEach((day, weekday) => {
        if (day == null) return;
        const cx = bx + weekday * STEP;
        const cy = by + titleH + weekdayH + weekIndex * STEP;
        const { fill, dark } = cellFill(month, day);
        shapes.push({ kind: "cell", x: cx, y: cy, fill });
        shapes.push({ kind: "text", x: cx + 1.3, y: cy + 3.7, text: String(day), size: 2.9, align: "left", fill: dark ? "#ffffff" : LABEL_FILL });
      })
    );
  }
  return { width: columns * blockW + (columns - 1) * gapX, height: 4 * blockH + 3 * gapY, shapes };
}

function font(weight: number, sizePx: number, family: string): string {
  return `${weight} ${sizePx}px ${family}`;
}

// Okraj okolo mriezky (v jednotkach mriezky) - polovica obrysu krajnych
// buniek lezi mimo ich stvorca a orez bloku by ju inak odrezal (napr.
// spodny okraj 31. riadku).
const GRID_EDGE = 0.6;

function drawGrid(ctx: CanvasRenderingContext2D, drawing: Drawing, rect: BlockRect, pxPerMm: number, fonts: PageFonts) {
  // "meet" (cela mriezka sa zmesti) zarovnana na stred zvisle hore.
  const outerW = drawing.width + 2 * GRID_EDGE;
  const outerH = drawing.height + 2 * GRID_EDGE;
  const mmPerUnit = Math.min(rect.w / outerW, rect.h / outerH);
  const unit = mmPerUnit * pxPerMm;
  const originX = (rect.x + (rect.w - outerW * mmPerUnit) / 2) * pxPerMm + GRID_EDGE * unit;
  const originY = rect.y * pxPerMm + GRID_EDGE * unit;
  const X = (u: number) => originX + u * unit;
  const Y = (u: number) => originY + u * unit;

  for (const shape of drawing.shapes) {
    if (shape.kind === "text") {
      ctx.font = font(shape.weight ?? 400, shape.size * unit, fonts.sans);
      ctx.fillStyle = shape.fill;
      ctx.textAlign = shape.align;
      ctx.textBaseline = "alphabetic";
      ctx.fillText(shape.text, X(shape.x), Y(shape.y + (shape.middle ? 0.35 * shape.size : 0)));
      continue;
    }
    ctx.beginPath();
    ctx.roundRect(X(shape.x), Y(shape.y), CELL * unit, CELL * unit, RADIUS * unit);
    ctx.fillStyle = shape.kind === "cell" ? shape.fill : EMPTY_FILL;
    ctx.fill();
    ctx.lineWidth = 0.5 * unit;
    ctx.strokeStyle = shape.kind === "cell" ? CELL_STROKE : "#d6d6d6";
    ctx.stroke();
    if (shape.kind === "missing") {
      // Neexistujuci den (napr. 30. februar) - preskrtnuta bunka.
      ctx.beginPath();
      ctx.moveTo(X(shape.x + 1.8), Y(shape.y + CELL - 1.8));
      ctx.lineTo(X(shape.x + CELL - 1.8), Y(shape.y + 1.8));
      ctx.lineWidth = 0.7 * unit;
      ctx.lineCap = "round";
      ctx.strokeStyle = "#c2c2c2";
      ctx.stroke();
    }
  }
}

// Text s rozostupom pismen (canvas letterSpacing nema kazdy prehliadac) -
// vrati sirku nakresleneho textu.
function spacedText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, spacing: number, draw: boolean): number {
  let cursor = x;
  for (const char of text) {
    if (draw) ctx.fillText(char, cursor, y);
    cursor += ctx.measureText(char).width + spacing;
  }
  return cursor - x - (text.length > 0 ? spacing : 0);
}

function drawTitle(ctx: CanvasRenderingContext2D, data: PageData, rect: BlockRect, pxPerMm: number, fonts: PageFonts) {
  const sizePx = Math.min(rect.h * 0.75, 24) * pxPerMm;
  const spacing = 0.06 * sizePx;
  ctx.font = font(700, sizePx, fonts.pixel);
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  const x = rect.x * pxPerMm;
  const y = (rect.y + rect.h / 2) * pxPerMm;
  const maxWidth = rect.w * pxPerMm;
  const yearText = data.year != null ? String(data.year) : "";
  const yearGap = yearText ? 0.5 * sizePx : 0;
  const yearWidth = yearText ? spacedText(ctx, yearText, 0, 0, spacing, false) : 0;

  // Prilis dlhy nazov na sirku bloku sa skrati trojbodkou (rovnako ako v CSS).
  let name = data.name.toUpperCase();
  const fits = (candidate: string) => spacedText(ctx, candidate, 0, 0, spacing, false) + yearGap + yearWidth <= maxWidth;
  if (!fits(name)) {
    while (name.length > 0 && !fits(`${name}…`)) name = name.slice(0, -1);
    name = `${name}…`;
  }
  ctx.fillStyle = "#1f1f1f";
  const nameWidth = spacedText(ctx, name, x, y, spacing, true);
  if (yearText) {
    ctx.fillStyle = "#8a8a82";
    spacedText(ctx, yearText, x + nameWidth + yearGap, y, spacing, true);
  }
}

// Nadpis sekcie (Legenda/Poznamky) - vrati, kde (v mm) zacina obsah pod nim.
function drawSectionHeading(ctx: CanvasRenderingContext2D, text: string, rect: BlockRect, pxPerMm: number, fonts: PageFonts): number {
  ctx.font = font(600, 4 * pxPerMm, fonts.sans);
  ctx.fillStyle = "#1f1f1f";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(text, rect.x * pxPerMm, rect.y * pxPerMm);
  return rect.y + 7.2;
}

function drawSwatch(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string | null) {
  const inset = size * 0.05;
  ctx.beginPath();
  ctx.roundRect(x + inset, y + inset, size - 2 * inset, size - 2 * inset, size * 0.15);
  ctx.fillStyle = color ?? EMPTY_FILL;
  ctx.fill();
  ctx.lineWidth = size * 0.08;
  ctx.strokeStyle = "#9a9a94";
  ctx.stroke();
}

function drawLegend(ctx: CanvasRenderingContext2D, data: PageData, rect: BlockRect, pxPerMm: number, fonts: PageFonts) {
  const top = drawSectionHeading(ctx, data.legendHeading, rect, pxPerMm, fonts);
  const swatch = 4.2;
  const textGap = 2;
  const rowPitch = 6;
  const columnGap = 6;
  const rows = Math.max(1, Math.floor((rect.h - 7) / rowPitch));
  const blankRows =
    data.content === "empty"
      ? data.values.length > 0
        ? BLANK_LEGEND_ROWS_WITH_VALUES
        : BLANK_LEGEND_ROWS_WITHOUT_VALUES
      : 0;
  const items: { name: string | null; color: string | null }[] = [
    ...data.values.map((v) => ({ name: v.name, color: data.content === "filled" ? v.color : null })),
    ...Array.from({ length: blankRows }, () => ({ name: null, color: null })),
  ];

  ctx.font = font(400, 3.4 * pxPerMm, fonts.sans);
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  const blankLineWidth = 28;
  let columnX = rect.x;
  for (let start = 0; start < items.length; start += rows) {
    const column = items.slice(start, start + rows);
    let textWidth = 0;
    column.forEach((item, row) => {
      const y = top + row * rowPitch;
      drawSwatch(ctx, columnX * pxPerMm, y * pxPerMm, swatch * pxPerMm, item.color);
      const textX = columnX + swatch + textGap;
      const centerY = y + swatch / 2;
      if (item.name != null) {
        ctx.fillStyle = "#1f1f1f";
        ctx.fillText(item.name, textX * pxPerMm, centerY * pxPerMm);
        textWidth = Math.max(textWidth, ctx.measureText(item.name).width / pxPerMm);
      } else {
        // Prazdny riadok na vlastnu hodnotu (prazdna sablona na vyfarbenie).
        ctx.beginPath();
        ctx.moveTo(textX * pxPerMm, (centerY + 1.7) * pxPerMm);
        ctx.lineTo((textX + blankLineWidth) * pxPerMm, (centerY + 1.7) * pxPerMm);
        ctx.lineWidth = Math.max(1, 0.3 * pxPerMm);
        ctx.strokeStyle = "#b5b5b5";
        ctx.stroke();
        textWidth = Math.max(textWidth, blankLineWidth);
      }
    });
    columnX += swatch + textGap + textWidth + columnGap;
  }
}

function drawNotes(ctx: CanvasRenderingContext2D, data: PageData, rect: BlockRect, pxPerMm: number, fonts: PageFonts) {
  const top = drawSectionHeading(ctx, data.notesHeading, rect, pxPerMm, fonts);
  const linePitch = 7.5;
  ctx.lineWidth = Math.max(1, 0.3 * pxPerMm);
  ctx.strokeStyle = "#c8c8c8";
  // Ciara presne na spodnom okraji bloku by bola orezana na polovicu.
  for (let y = top + linePitch; y <= rect.y + rect.h - 0.3; y += linePitch) {
    ctx.beginPath();
    ctx.moveTo(rect.x * pxPerMm, y * pxPerMm);
    ctx.lineTo((rect.x + rect.w) * pxPerMm, y * pxPerMm);
    ctx.stroke();
  }
}

// Kazdy blok sa kresli orezany na svoj obdlznik - rovnako ako v nahlade
// (overflow: hidden), nic nepretecie do susedneho bloku.
function clipped(ctx: CanvasRenderingContext2D, rect: BlockRect, pxPerMm: number, draw: () => void) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x * pxPerMm, rect.y * pxPerMm, rect.w * pxPerMm, rect.h * pxPerMm);
  ctx.clip();
  draw();
  ctx.restore();
}

export function renderPage(
  ctx: CanvasRenderingContext2D,
  widthMm: number,
  heightMm: number,
  pxPerMm: number,
  data: PageData,
  blocks: BlockLayout,
  fonts: PageFonts
) {
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, widthMm * pxPerMm, heightMm * pxPerMm);

  const colorByValueId = new Map(data.values.map((v) => [v.id, v.color]));
  const valueIdByCell = new Map(data.pixels.map((p) => [`${p.month}-${p.day}`, p.valueId]));
  const cellFill: CellFill = (month, day) => {
    const valueId = data.content === "filled" ? valueIdByCell.get(`${month}-${day}`) : null;
    const color = valueId ? colorByValueId.get(valueId) : undefined;
    if (color) return { fill: color, dark: isDarkColor(color) };
    return {
      fill: data.showWeekends && isWeekend(data.calendarYear, month, day) ? WEEKEND_FILL : EMPTY_FILL,
      dark: false,
    };
  };
  const drawing =
    data.layout === "columns"
      ? gridColumns(data.calendarYear, data.monthNames, cellFill)
      : data.layout === "rows"
        ? gridRows(data.calendarYear, data.monthNames, cellFill)
        : gridCalendar(data.calendarYear, data.monthNames, data.weekdayNames, cellFill);

  clipped(ctx, blocks.title, pxPerMm, () => drawTitle(ctx, data, blocks.title, pxPerMm, fonts));
  clipped(ctx, blocks.grid, pxPerMm, () => drawGrid(ctx, drawing, blocks.grid, pxPerMm, fonts));
  // Vyplneny sheet bez hodnot nema co vysvetlovat; prazdna sablona dostane
  // aspon prazdne riadky na vlastnu legendu.
  if (data.showLegend && (data.content === "empty" || data.values.length > 0)) {
    clipped(ctx, blocks.legend, pxPerMm, () => drawLegend(ctx, data, blocks.legend, pxPerMm, fonts));
  }
  if (data.showNotes) {
    clipped(ctx, blocks.notes, pxPerMm, () => drawNotes(ctx, data, blocks.notes, pxPerMm, fonts));
  }
}

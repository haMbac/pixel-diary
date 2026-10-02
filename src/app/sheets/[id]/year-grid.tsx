"use client";

import { Fragment } from "react";
import { daysInMonth } from "@/lib/calendar";
import { useT } from "@/i18n/context";

export type YearGridLayout = "auto" | "columns" | "rows";

export type GridCellProps = {
  monthNames: string[];
  year: number;
  getColor: (month: number, day: number) => string | null;
  isToday: (month: number, day: number) => boolean;
  canPaint: boolean;
  onCellClick: (month: number, day: number) => void;
};

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

// Ramik dnesneho dna - vyraznejsi akcent nez svetly `var(--border)` kariet,
// aby bol jasne viditelny aj na vyfarbenej bunke.
export const TODAY_BORDER = "var(--accent)";
export const EMPTY_CELL_COLOR = "#f9fafb";
export const CELL_BORDER_COLOR = "#d1d5db";

// Zvyraznenie mesiaca a dna pod kurzorom - cisto v CSS (:has), bez React
// stavu: pri pohybe mysou sa nic neprekresluje. Hover len pre zariadenia s
// mysou (na dotykovych by "prilepeny" hover po tuknuti ostal visiet);
// focus-visible pre klavesnicu vsade.
function highlightCss(trigger: ":hover" | ":focus-visible"): string {
  return [
    ...MONTHS.map((m) => `.yg:has([data-m="${m}"]${trigger}) [data-ml="${m}"]`),
    ...DAYS.map((d) => `.yg:has([data-d="${d}"]${trigger}) [data-dl="${d}"]`),
  ].join(",");
}
const HIGHLIGHT_RULE = "{color:var(--accent);background-color:var(--accent-soft);font-weight:600}";
const HIGHLIGHT_CSS = `@media (hover:hover){${highlightCss(":hover")}${HIGHLIGHT_RULE}}${highlightCss(":focus-visible")}${HIGHLIGHT_RULE}`;

// Mriezka celeho roka. To iste HTML (hlavicka + 31 riadkov po 13 polozkach:
// cislo dna + 12 buniek) CSS (globals.css .yg--*) zobrazi bud ako mesiace v
// stlpcoch, alebo "transponovane" ako mesiace v riadkoch - "auto" medzi nimi
// prepina len media query podla orientacie, takze server vykresli spravne
// zobrazenie bez JS a pri nacitani nic nepreblikne.
export function YearGrid({
  layout,
  monthNames,
  year,
  getColor,
  isToday,
  canPaint,
  onCellClick,
}: GridCellProps & { layout: YearGridLayout }) {
  const t = useT();

  return (
    <div className={`yg-scroll yg-scroll--${layout}`}>
      <style dangerouslySetInnerHTML={{ __html: HIGHLIGHT_CSS }} />
      <div className={`yg yg--${layout}`}>
        <div className="yg-corner" aria-hidden="true" />
        {monthNames.map((name, index) => (
          <div key={index} className="yg-label yg-month" data-ml={index + 1}>
            {name}
          </div>
        ))}
        {DAYS.map((day) => (
          <Fragment key={day}>
            <div className="yg-label yg-day" data-dl={day}>
              {day}
            </div>
            {MONTHS.map((month) =>
              // Den, ktory v danom mesiaci neexistuje (napr. 30. februar) -
              // seda neklikatelna bunka, aby mriezka ostala vizualne 31x12.
              day > daysInMonth(year, month) ? (
                <div key={month} className="yg-cell yg-cell--none" aria-hidden="true" />
              ) : (
                <button
                  key={month}
                  type="button"
                  className="yg-cell"
                  data-m={month}
                  data-d={day}
                  onClick={() => onCellClick(month, day)}
                  title={t.sheet.cellTitle(day, monthNames[month - 1])}
                  style={{
                    border: isToday(month, day) ? `2px solid ${TODAY_BORDER}` : `1px solid ${CELL_BORDER_COLOR}`,
                    backgroundColor: getColor(month, day) ?? EMPTY_CELL_COLOR,
                    cursor: canPaint ? "pointer" : "not-allowed",
                  }}
                />
              )
            )}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

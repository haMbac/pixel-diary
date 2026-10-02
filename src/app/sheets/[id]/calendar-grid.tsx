"use client";

import { monthWeeks } from "@/lib/calendar";
import { isDarkColor } from "@/lib/color";
import { useT } from "@/i18n/context";
import { CELL_BORDER_COLOR, EMPTY_CELL_COLOR, TODAY_BORDER, type GridCellProps } from "./year-grid";

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6];

// Rovnaky princip zvyraznenia ako v YearGrid (cisto CSS), len v ramci
// jedneho mesiaca: nazov mesiaca + den v tyzdni (stlpec) bunky pod kurzorom.
function highlightCss(trigger: ":hover" | ":focus-visible"): string {
  return [
    `.cal-month:has(.cal-cell${trigger}) .cal-title`,
    ...WEEKDAYS.map((wd) => `.cal-month:has([data-wd="${wd}"]${trigger}) [data-wl="${wd}"]`),
  ].join(",");
}
const HIGHLIGHT_RULE = "{color:var(--accent);background-color:var(--accent-soft);font-weight:600}";
const HIGHLIGHT_CSS = `@media (hover:hover){${highlightCss(":hover")}${HIGHLIGHT_RULE}}${highlightCss(":focus-visible")}${HIGHLIGHT_RULE}`;

// Klasicky kalendar - kazdy mesiac ako mriezka 7 dni (pondelok az nedela),
// vzdy 6 tyzdnov (rovnako vysoke bloky). Pocet mesiacov vedla seba podla
// sirky (globals.css .cal): 2 na mobile na vysku (3 by zmensili bunky na
// ~14px, prilis male na tuknutie), 3 na stredne sirokych, 4 na sirokych.
export function CalendarGrid({
  monthNames,
  weekdayNames,
  year,
  getColor,
  isToday,
  canPaint,
  onCellClick,
}: GridCellProps & { weekdayNames: string[] }) {
  const t = useT();

  return (
    <div className="cal">
      <style dangerouslySetInnerHTML={{ __html: HIGHLIGHT_CSS }} />
      {MONTHS.map((month) => (
        <section key={month} className="cal-month" aria-label={monthNames[month - 1]}>
          <div className="cal-title">{monthNames[month - 1]}</div>
          <div className="cal-days">
            {weekdayNames.map((name, weekday) => (
              <div key={weekday} className="cal-weekday" data-wl={weekday}>
                {name}
              </div>
            ))}
            {monthWeeks(year, month)
              .flat()
              .map((day, index) => {
                if (day == null) {
                  return <div key={index} className="cal-empty" aria-hidden="true" />;
                }
                const color = getColor(month, day);
                return (
                  <button
                    key={index}
                    type="button"
                    className="cal-cell"
                    data-wd={index % 7}
                    onClick={() => onCellClick(month, day)}
                    title={t.sheet.cellTitle(day, monthNames[month - 1])}
                    style={{
                      border: isToday(month, day) ? `2px solid ${TODAY_BORDER}` : `1px solid ${CELL_BORDER_COLOR}`,
                      backgroundColor: color ?? EMPTY_CELL_COLOR,
                      color: color ? (isDarkColor(color) ? "#ffffff" : "var(--ink)") : "var(--ink-muted)",
                      cursor: canPaint ? "pointer" : "not-allowed",
                    }}
                  >
                    {day}
                  </button>
                );
              })}
          </div>
        </section>
      ))}
    </div>
  );
}

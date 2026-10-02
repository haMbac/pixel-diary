// Gregorianske pravidlo pre priestupny rok: delitelny 4, ale ak je
// delitelny 100 tak musi byt aj delitelny 400 (napr. 2000 je priestupny,
// 1900 nie je, 2028 je).
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

// Rok, podla ktoreho sa rata kalendar sheetu. Sheet bez roku sa vsade v
// appke (dnesny den v mriezke, denny zapis) berie ako "aktualny rok" - tu
// presne rovnako, inak by napr. 29. februar v priestupnom roku chybal v
// mriezke, hoci denny zapis by ho uz vedel ulozit.
export function effectiveYear(year: number | null | undefined): number {
  return year ?? new Date().getFullYear();
}

const DAYS_IN_MONTH_COMMON = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

// month: 1-12.
export function daysInMonth(year: number | null | undefined, month: number): number {
  if (month === 2 && isLeapYear(effectiveYear(year))) return 29;
  return DAYS_IN_MONTH_COMMON[month - 1];
}

// Den v tyzdni: 0 = pondelok ... 6 = nedela. Cisty vzorec (Sakamotova
// metoda) namiesto new Date(rok, ...) - Date by roky 0-99 prelozil na
// 1900-1999 a rok sheetu sa pri zadavani nijako neobmedzuje.
const SAKAMOTO_OFFSETS = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4];
export function weekdayMon0(year: number, month: number, day: number): number {
  const y = month < 3 ? year - 1 : year;
  const sunday0 =
    y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) + SAKAMOTO_OFFSETS[month - 1] + day;
  return (((sunday0 + 6) % 7) + 7) % 7;
}

export function isWeekend(year: number, month: number, day: number): boolean {
  return weekdayMon0(year, month, day) >= 5;
}

// Mesiac ako kalendarova mriezka po tyzdnoch (pondelok az nedela), null =
// policko mimo mesiaca. Vzdy 6 tyzdnov, aj ked mesiac zaberie len 4-5 -
// bloky vsetkych mesiacov su potom rovnako vysoke a v kalendari aj v PDF
// lezia v pravidelnej mriezke.
export function monthWeeks(year: number, month: number): (number | null)[][] {
  const offset = weekdayMon0(year, month, 1);
  const days = daysInMonth(year, month);
  return Array.from({ length: 6 }, (_, week) =>
    Array.from({ length: 7 }, (_, weekday) => {
      const day = week * 7 + weekday - offset + 1;
      return day >= 1 && day <= days ? day : null;
    })
  );
}

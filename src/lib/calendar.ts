// Gregorianske pravidlo pre priestupny rok: delitelny 4, ale ak je
// delitelny 100 tak musi byt aj delitelny 400 (napr. 2000 je priestupny,
// 1900 nie je, 2028 je).
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

const DAYS_IN_MONTH_COMMON = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

// month: 1-12. Ak rok sheetu nie je zadany (null - stary sheet bez roku),
// pouzije sa nepriestupny rok (februar = 28 dni) ako bezpecny default.
export function daysInMonth(year: number | null | undefined, month: number): number {
  if (month === 2 && year != null && isLeapYear(year)) return 29;
  return DAYS_IN_MONTH_COMMON[month - 1];
}

// Zobrazenie mriezky sheetu - pamata sa na zariadeni (cookie, nie v DB),
// pre vsetky sheety naraz. "auto" = podla orientacie obrazovky (na
// vysku mesiace v stlpcoch, na sirku mesiace v riadkoch). Cookie (nie
// localStorage), aby server vedel vykreslit spravne zobrazenie hned pri
// prvom nacitani, bez preblikutia. Tento subor sa importuje aj na klientovi,
// preto tu nesmie byt nic z "next/headers".
export const SHEET_VIEWS = ["auto", "columns", "rows", "calendar"] as const;
export type SheetView = (typeof SHEET_VIEWS)[number];

export const SHEET_VIEW_COOKIE = "pd_sheet_view";

export function parseSheetView(value: string | null | undefined): SheetView | null {
  return SHEET_VIEWS.includes(value as SheetView) ? (value as SheetView) : null;
}

export function readSheetViewCookie(): SheetView | null {
  if (typeof document === "undefined") return null;
  const prefix = `${SHEET_VIEW_COOKIE}=`;
  const entry = document.cookie.split("; ").find((c) => c.startsWith(prefix));
  return parseSheetView(entry?.slice(prefix.length));
}

export function writeSheetViewCookie(view: SheetView): void {
  document.cookie = `${SHEET_VIEW_COOKIE}=${view}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}

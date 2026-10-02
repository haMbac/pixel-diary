// Male ikony pre spolocne tlacidla stranok (spat / upravit / menu) - pixelove
// SVG z Pixelarticons (pixelarticons.com, autor Gerrit Halfmann, MIT
// licencia), bez vlastneho kruhoveho ramca okolo seba (bod: "bez kruhov,
// vacsie"). Zdielane medzi ObjectPageShell a SheetPageShell.
export function BackArrowIcon({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20 11v2H4v-2zM8 13v2H6v-2zm2 2v2H8v-2zm2 2v2h-2v-2zm-4-6V9H6v2z" />
      <path d="M10 15V7H8v8zm2 2V5h-2v12z" />
    </svg>
  );
}

export function EditIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M4 16H6V18H8V20H10V22H2V14H4V16ZM12 20H10V18H12V20ZM14 18H12V16H14V18ZM10 16H8V14H10V16ZM16 16H14V14H16V16ZM6 14H4V12H6V14ZM12 14H10V12H12V14ZM18 14H16V12H18V14ZM8 12H6V10H8V12ZM14 12H12V10H14V12ZM20 12H18V10H20V12ZM10 10H8V8H10V10ZM18 10H16V8H18V10ZM22 10H20V8H22V10ZM12 8H10V6H12V8ZM16 8H14V6H16V8ZM20 8H18V6H20V8ZM14 6H12V4H14V6ZM18 6H16V4H18V6ZM16 4H14V2H16V4Z" />
    </svg>
  );
}

export function MenuIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20 18H4v-2h16v2Zm0-5H4v-2h16v2Zm0-5H4V6h16v2Z" />
    </svg>
  );
}

// Ikony prepinaca zobrazenia sheetu (vlastne, v rovnakom pixelovom stylku
// 24x24 ako Pixelarticons vyssie): "A" = automaticky podla orientacie,
// zvisle pruhy = mesiace v stlpcoch, vodorovne = mesiace v riadkoch.
export function ViewAutoIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M9 5h6v2H9zM7 7h2v12H7zM15 7h2v12h-2zM9 11h6v2H9z" />
    </svg>
  );
}

export function ViewColumnsIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M4 4h4v16H4zM10 4h4v16h-4zM16 4h4v16h-4z" />
    </svg>
  );
}

export function ViewRowsIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M4 4h16v4H4zM4 10h16v4H4zM4 16h16v4H4z" />
    </svg>
  );
}

export function ViewCalendarIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M6 2h2v2H6zM16 2h2v2h-2zM4 4h16v4H4zM4 8h2v12H4zM18 8h2v12h-2zM6 18h12v2H6zM8 10h2v2H8zM11 10h2v2h-2zM14 10h2v2h-2zM8 14h2v2H8zM11 14h2v2h-2zM14 14h2v2h-2z" />
    </svg>
  );
}

// Sipky "predchadzajuci/nasledujuci" v karuseloch a menu (‹ ›) - tenssie
// nez BackArrowIcon, zamerne (bod: "zmenit aj tieto", bez kruhu, vacsie).
export function ChevronLeftIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 13v-2h2v2H8Zm2-2V9h2v2h-2Zm0 4v-2h2v2h-2Zm2-6V7h2v2h-2Zm0 8v-2h2v2h-2Zm2-10V5h2v2h-2Zm0 12v-2h2v2h-2Z" />
    </svg>
  );
}

export function ChevronRightIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16 13v-2h-2v2h2Zm-2-2V9h-2v2h2Zm0 4v-2h-2v2h2Zm-2-6V7h-2v2h2Zm0 8v-2h-2v2h2ZM10 7V5H8v2h2Zm0 12v-2H8v2h2Z" />
    </svg>
  );
}

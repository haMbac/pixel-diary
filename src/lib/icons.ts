// Preddefinovana sada ikon pre kategorie/objekty (bod: "predvolena ikona,
// ktoru moze pouzivatel pouzit, ale ma aj moznost nahrat vlastnu fotku").
// Zdroj: Pixelarticons (pixelarticons.com), autor Gerrit Halfmann, licencia
// MIT (volne pouzitelne, bez povinnej atribucie) - SVG cesty skopirovane
// priamo z ich zdroja (24x24 viewBox, "fill: currentColor").
export type DefaultIcon = {
  key: string;
  label: string;
  path: string;
};

export const DEFAULT_ICONS: DefaultIcon[] = [
  {
    key: "book-open",
    label: "Kniha",
    path: "M2 3h9v2H2zM0 19h11v2H0zM13 3h9v2h-9zm0 16h11v2H13zM11 5h2v18h-2zM0 5h2v14H0zm22 0h2v14h-2zm-7 2h5v2h-5zm0 4h5v2h-5zm0 4h2v2h-2z",
  },
  {
    key: "video",
    label: "Film",
    path: "M20 17V7h2v10zm-2-2V9h2v6zM2 7h2v10H2zm14 0h2v10h-2zM4 5h12v2H4zm0 12h12v2H4z",
  },
  {
    key: "tv",
    label: "Seriál",
    path: "M4 3h16v2H4zM2 5h2v10H2zm2 10h16v2H4zM20 5h2v10h-2zM6 19h12v2H6zm3-2h2v2H9zm4 0h2v2h-2z",
  },
  {
    key: "music",
    label: "Hudba",
    path: "M4 12h4v2H4zm-2 2h2v4H2zm2 4h4v2H4zM8 6h2v12H8zm10 0h2v12h-2zm-6 8h2v4h-2zm2-2h4v2h-4zm0 6h4v2h-4zM10 4h8v2h-8z",
  },
  {
    key: "gamepad",
    label: "Hry",
    path: "M4 4h16v2H4zm0 14h16v2H4zM2 6h2v12H2zm18 0h2v12h-2zM8 9h2v6H8zM6 11h6v2H6zm8-2h2v2h-2zm2 4h2v2h-2z",
  },
  {
    key: "camera",
    label: "Fotky",
    path: "M4 5h4v2H4zm4-2h8v2H8zm8 2h4v2h-4zM2 7h2v12H2zm2 12h16v2H4zM20 7h2v12h-2zM10 8h4v2h-4zm0 6h4v2h-4zm-2-4h2v4H8zm6 0h2v4h-2z",
  },
  {
    key: "heart",
    label: "Zdravie",
    path: "M13 22h-2v-2h2zm-2-2H9v-2h2zm4 0h-2v-2h2zm-6-2H7v-2h2zm8 0h-2v-2h2zM7 16H5v-2h2zm12 0h-2v-2h2zM5 14H3v-2h2zm16 0h-2v-2h2zM3 12H1V6h2zm20 0h-2V6h2zM13 8h-2V6h2zM5 6H3V4h2zm6 0H9V4h2zm4 0h-2V4h2zm6 0h-2V4h2zM9 4H5V2h4zm10 0h-4V2h4z",
  },
  {
    key: "briefcase",
    label: "Práca",
    path: "M2 8h2v12H2zm18 0h2v12h-2zM4 6h16v2H4zm0 14h16v2H4zM8 4h2v2H8zm2-2h4v2h-4zm4 2h2v2h-2z",
  },
  {
    key: "coffee",
    label: "Jedlo a pitie",
    path: "M4 4h16v2H4zm0 2h2v8H4zm2 8h10v2H6zm14-8h2v4h-2zm-2 4h2v2h-2zm-2-4h2v8h-2zM2 18h18v2H2z",
  },
  {
    key: "shirt",
    label: "Móda",
    path: "M4 3h6v2H4zM2 3h2v8H2zm2 6h4v2H4zM6 9h2v10H6zm2 10h8v2H8zm8-10h2v10h-2zM16 9h4v2h-4zm4-6h2v8h-2zm-6 0h6v2h-6zm-4 2h4v2h-4z",
  },
  {
    key: "car",
    label: "Auto",
    path: "M4 13h6v2H4zm10 0h6v2h-6zM4 17h6v2H4zm10 0h6v2h-6zM2 15h4v2H2zm6 0h8v2H8zm10 0h4v2h-4zm4-4h2v4h-2zm-6-4h2v2h-2zM4 5h12v2H4zm-4 6h2v4H0zm12-2h10v2H12zM2 7h2v4H2zm8 0h2v2h-2z",
  },
  {
    key: "home",
    label: "Domácnosť",
    path: "M4 20h16v2H4zm16-10h2v10h-2zM2 10h2v10H2zm2-2h2v2H4zm2-2h2v2H6zm2-2h2v2H8zm2-2h4v2h-4zm4 2h2v2h-2zm2 2h2v2h-2zm2 2h2v2h-2zM8 14h2v6H8zm2-2h4v2h-4zm4 2h2v6h-2z",
  },
  {
    key: "star",
    label: "Obľúbené",
    path: "M5 20h3v2H3v-6h2zm16 2h-5v-2h3v-4h2zm-11-2H8v-2h2zm6 0h-2v-2h2zm-2-2h-4v-2h4zm-7-2H5v-3h2zm12 0h-2v-3h2zM5 13H3v-2h2zm16 0h-2v-2h2zM9 9H3v2H1V7h8zm14 2h-2V9h-6V7h8zM11 7H9V3h2zm4 0h-2V3h2zm-2-4h-2V1h2z",
  },
  {
    key: "folder",
    label: "Iné",
    path: "M4 4h6v2H4zm0 14h16v2H4zM20 8h2v10h-2zM2 6h2v12H2zm8 0h10v2H10z",
  },
];

// Ked kategoria/objekt zatial nema ziadnu ikonu vybratu.
export const FALLBACK_ICON_KEY = "folder";

export type ResolvedIcon =
  | { kind: "photo"; url: string }
  | { kind: "icon"; icon: DefaultIcon };

// Konvencia (bez samostatneho enum stlpca): hodnota zacinajuca "/uploads/"
// (lokalny disk) alebo "https://" (Vercel Blob) je adresa nahranej fotky,
// cokolvek ine je kluc do DEFAULT_ICONS. null alebo neznamy kluc padne na
// FALLBACK_ICON_KEY.
export function resolveIcon(value: string | null | undefined): ResolvedIcon {
  if (value && (value.startsWith("/uploads/") || value.startsWith("https://"))) {
    return { kind: "photo", url: value };
  }
  const icon =
    DEFAULT_ICONS.find((i) => i.key === value) ??
    DEFAULT_ICONS.find((i) => i.key === FALLBACK_ICON_KEY)!;
  return { kind: "icon", icon };
}

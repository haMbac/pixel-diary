import { cache } from "react";
import { prisma } from "@/lib/prisma";

// Jeden sheet aj s hodnotami a pixelmi - VZDY aj podla userId, inak by sa
// dal nacitat cudzi sheet len uhadnutim jeho id v URL. V React cache(), lebo
// stranka PDF exportu ho potrebuje dvakrat v jednej poziadavke (stranka aj
// generateMetadata) a Prisma (na rozdiel od fetch) dopyty sama nezluci.
export const getSheetForUser = cache(async (sheetId: string, userId: string) =>
  prisma.sheet.findFirst({
    where: { id: sheetId, userId },
    include: {
      values: { orderBy: [{ order: "asc" }, { name: "asc" }] },
      pixels: true,
    },
  })
);

export type SheetSummary = {
  id: string;
  name: string;
  year: number | null;
  order: number;
  pixels: { day: number; month: number; color: string | null }[];
};

// Spolocne pre hlavnu stranku aj pre "menu sheetov" na stranke sheetu (bod 3.11
// vo funkcnej specifikacii) - obe potrebuju ten isty zoznam sheetov so
// zjednodusenymi datami pre miniatury (bez toho aby sa dopytovanie pisalo
// dvakrat).
//
// Poradie: `order` - manualne poradie (bod 3.14, dá sa presúvať v menu
// sheetov). Novy sheet dostane pri vytvoreni order = (najvyssie existujuce + 1),
// takze FIFO poradie (najskor vytvoreny prvy) je default, kym ho P rucne
// nezmeni.
export async function getSheetSummaries(userId: string): Promise<SheetSummary[]> {
  const sheetsRaw = await prisma.sheet.findMany({
    where: { userId },
    orderBy: { order: "asc" },
    select: {
      id: true,
      name: true,
      year: true,
      order: true,
      pixels: {
        select: { day: true, month: true, value: { select: { color: true } } },
      },
    },
  });

  return sheetsRaw.map((sheet) => ({
    id: sheet.id,
    name: sheet.name,
    year: sheet.year,
    order: sheet.order,
    pixels: sheet.pixels.map((p) => ({
      day: p.day,
      month: p.month,
      color: p.value?.color ?? null,
    })),
  }));
}

export type DailyEntrySheet = {
  id: string;
  name: string;
  values: { id: string; name: string; color: string }[];
  // Hodnota uz zapisana pre DNESOK (den+mesiac) na tomto sheete, ak nejaka
  // existuje - bod: "ak uz bol dnesny zaznam vyplneny, ukaz to a oponuknuti
  // zmenu" namiesto toho, aby sa sprievodca vzdy tvaril, ze je to prve
  // vyplnanie.
  todayValueId: string | null;
};

// Bod 5 (Denny zapis) - sheety, ktore ma zmysel ponuknut v "Dnes" sprievodcovi:
// - rovnaky rok ako aktualny, alebo bez roku (stary sheet) - inak by "dnesok"
//   na tom sheete vobec neexistoval (rovnaka podmienka ako isToday() v
//   sheets/[id]/sheet-editor.tsx)
// - aspon jedna hodnota v legende - prazdny sheet by nemal z coho vyberat
export async function getSheetsForDailyEntry(userId: string): Promise<DailyEntrySheet[]> {
  const currentYear = new Date().getFullYear();
  const today = new Date();
  const day = today.getDate();
  const month = today.getMonth() + 1;

  const sheets = await prisma.sheet.findMany({
    where: {
      userId,
      OR: [{ year: null }, { year: currentYear }],
    },
    orderBy: { order: "asc" },
    select: {
      id: true,
      name: true,
      values: {
        orderBy: [{ order: "asc" }, { name: "asc" }],
        select: { id: true, name: true, color: true },
      },
      pixels: {
        where: { day, month },
        select: { valueId: true },
      },
    },
  });

  return sheets
    .filter((sheet) => sheet.values.length > 0)
    .map((sheet) => ({
      id: sheet.id,
      name: sheet.name,
      values: sheet.values,
      todayValueId: sheet.pixels[0]?.valueId ?? null,
    }));
}

import { prisma } from "@/lib/prisma";

export type SheetSummary = {
  id: string;
  name: string;
  year: number | null;
  pixels: { day: number; month: number; color: string | null }[];
};

// Spolocne pre hlavnu stranku aj pre "menu sheetov" na stranke sheetu (bod 3.11
// vo funkcnej specifikacii) - obe potrebuju ten isty zoznam sheetov so
// zjednodusenymi datami pre miniatury (bez toho aby sa dopytovanie pisalo
// dvakrat).
export async function getSheetSummaries(userId: string): Promise<SheetSummary[]> {
  const sheetsRaw = await prisma.sheet.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      year: true,
      pixels: {
        select: { day: true, month: true, value: { select: { color: true } } },
      },
    },
  });

  return sheetsRaw.map((sheet) => ({
    id: sheet.id,
    name: sheet.name,
    year: sheet.year,
    pixels: sheet.pixels.map((p) => ({
      day: p.day,
      month: p.month,
      color: p.value?.color ?? null,
    })),
  }));
}

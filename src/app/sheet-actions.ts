"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";
import { getLocale } from "@/lib/locale";
import { dictionary } from "@/i18n/dictionary";

export type CreateSheetState = { error: string | null };
export type CreateSheetAction = (
  prevState: CreateSheetState,
  formData: FormData
) => Promise<CreateSheetState>;
export type ReorderSheetsAction = (orderedIds: string[]) => Promise<void>;
export type DeleteSheetAction = (sheetId: string) => Promise<void>;

// Zdielana Server Action - pouziva ju formular na hlavnej stranke aj
// formular v "menu sheetov" na stranke sheetu (bod 3.11), takze je tu
// definovana raz namiesto kopirovania na dvoch miestach.
export async function createSheet(
  prevState: CreateSheetState,
  formData: FormData
): Promise<CreateSheetState> {
  const locale = await getLocale();
  const t = dictionary[locale];
  const name = formData.get("name");
  if (typeof name !== "string" || name.trim() === "") {
    return { error: t.sheet.nameRequiredError };
  }
  const trimmedName = name.trim();

  const yearRaw = formData.get("year");
  const year =
    typeof yearRaw === "string" && yearRaw.trim() !== "" && !Number.isNaN(Number(yearRaw))
      ? Number(yearRaw)
      : null;

  const user = await getCurrentUser();

  // Novy sheet ide na koniec zoznamu (FIFO) - o 1 vyssie ako aktualne
  // najvyssie "order" tohto usera.
  const lastSheet = await prisma.sheet.findFirst({
    where: { userId: user.id },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  const order = (lastSheet?.order ?? -1) + 1;

  let newSheet;
  try {
    newSheet = await prisma.sheet.create({
      data: { name: trimmedName, year, userId: user.id, order },
    });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return { error: t.sheet.sheetNameExistsError(trimmedName) };
    }
    throw error;
  }

  // "layout" revaliduje vsetky stranky pod root layoutom (t.j. cely web),
  // takze sa novy sheet objavi aj na hlavnej stranke aj v "menu sheetov"
  // otvorenom z inej stranky sheetu.
  revalidatePath("/", "layout");

  // Bod 3.12: po stlaceni "Create" S vytvori sheet a pouzivatela rovno
  // presunie na jeho stranku - tam uz je hotove tlacidlo na pridanie
  // hodnoty (3.21), takze to nemusime duplikovat v tomto okne.
  redirect(`/sheets/${newSheet.id}`);
}

// Bod 3.14: presunutim (drag & drop) v menu sheetov zmeni P poradie.
// `orderedIds` je KOMPLETNY novy zoznam id v novom poradi - ulozime index
// kazdeho id ako jeho "order". `updateMany` s userId v podmienke = aj keby
// niekto poslal cudzie id, aktualizuje sa len ked patri prihlasenemu userovi.
export async function reorderSheets(orderedIds: string[]) {
  "use server";
  const user = await getCurrentUser();

  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.sheet.updateMany({
        where: { id, userId: user.id },
        data: { order: index },
      })
    )
  );

  revalidatePath("/", "layout");
}

// Bod: vymazanie sheetu z "menu sheetov" (nie z jeho vlastnej stranky - tam
// zatial nie je vobec tlacidlo na to, na rozdiel od kategorii, kde
// "Vymazat kategoriu" zije na vlastnej stranke kategorie). deleteMany +
// userId v podmienke = nikdy nezmaze cudzi sheet, aj keby niekto poslal
// cudzie id.
export async function deleteSheet(sheetId: string): Promise<void> {
  "use server";
  const user = await getCurrentUser();
  await prisma.sheet.deleteMany({
    where: { id: sheetId, userId: user.id },
  });
  revalidatePath("/", "layout");
}

export type DailyEntryPick = { sheetId: string; valueId: string };

// Bod 5 (Denny zapis): "Dnes" sprievodca prejde vsetky sheety a P si pre
// kazdy vyberie hodnotu (alebo ho preskoci). Podla specifikacie sa vsetko
// ulozi az naraz na konci (tlacidlo "Hotovo"), nie priebezne pri kazdom
// kroku - preto je to jedna Server Action, ktora dostane VSETKY vybrane
// dvojice naraz. Sheety, ktore P preskocil, tu vobec nie su (skip = ziadny
// zapis, nezmeni existujucu hodnotu).
export async function submitDailyEntry(picks: DailyEntryPick[]) {
  "use server";
  if (picks.length === 0) return;

  const user = await getCurrentUser();
  const today = new Date();
  const day = today.getDate();
  const month = today.getMonth() + 1;

  // Overenie, ze kazdy sheetId v "picks" naozaj patri prihlasenemu userovi -
  // klient sam ponuka na vyber len sheety zo svojho vlastneho zoznamu, ale
  // rovnako ako inde v appke sa tomu never a overi sa to este raz na serveri.
  const ownedSheets = await prisma.sheet.findMany({
    where: { userId: user.id, id: { in: picks.map((p) => p.sheetId) } },
    select: { id: true },
  });
  const ownedIds = new Set(ownedSheets.map((s) => s.id));
  const validPicks = picks.filter((p) => ownedIds.has(p.sheetId));

  await prisma.$transaction(
    validPicks.map((pick) =>
      prisma.pixel.upsert({
        where: { sheetId_day_month: { sheetId: pick.sheetId, day, month } },
        create: { sheetId: pick.sheetId, day, month, valueId: pick.valueId },
        update: { valueId: pick.valueId },
      })
    )
  );

  revalidatePath("/", "layout");
  for (const pick of validPicks) {
    revalidatePath(`/sheets/${pick.sheetId}`);
  }
}

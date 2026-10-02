import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";
import { getSheetForUser, getSheetSummaries } from "@/lib/sheets";
import { colorDistance, MAX_VALUES_PER_SHEET, MIN_COLOR_DISTANCE } from "@/lib/color";
import { getLocale } from "@/lib/locale";
import { SHEET_VIEW_COOKIE, parseSheetView } from "@/lib/sheet-view";
import { dictionary } from "@/i18n/dictionary";
import { createSheet, reorderSheets, deleteSheet } from "@/app/sheet-actions";
import { SheetEditor } from "./sheet-editor";
import { SheetPageShell } from "./sheet-page-shell";

// V Next.js 16 su URL parametre (tu [id]) asynchronne - preto `params`
// je Promise a musime ho najprv "await"-nut.
export default async function SheetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  // getSheetForUser hlada sheet AJ podla userId - nikdy nie cudzi sheet,
  // aj keby niekto uhadol jeho id v URL. sheet.year: cislo roku alebo null
  // (sheet bez roku = aktualny rok, pozri effectiveYear v lib/calendar.ts).
  const sheet = await getSheetForUser(id, user.id);
  if (!sheet) notFound();

  const sheets = await getSheetSummaries(user.id);
  const initialView = parseSheetView((await cookies()).get(SHEET_VIEW_COOKIE)?.value) ?? "auto";

  type ActionState = { error: string | null };

  // Bod 3.13: premenovanie sheetu (analogicke ku renameCategory v
  // objects/[categoryId]/page.tsx). Vymazanie sheetu je zamerne LEN v
  // "menu sheetov" (SheetsGrid), nie tu na vlastnej stranke - pozri
  // deleteSheet v sheet-actions.ts.
  async function renameSheet(
    prevState: ActionState,
    formData: FormData
  ): Promise<ActionState> {
    "use server";
    const locale = await getLocale();
    const t = dictionary[locale];
    const name = formData.get("name");
    if (typeof name !== "string" || name.trim() === "") {
      return { error: t.sheet.nameRequiredError };
    }
    const trimmedName = name.trim();

    try {
      await prisma.sheet.updateMany({
        where: { id: sheet!.id, userId: user.id },
        data: { name: trimmedName },
      });
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
        return { error: t.sheet.sheetNameExistsError(trimmedName) };
      }
      throw error;
    }

    revalidatePath(`/sheets/${sheet!.id}`);
    revalidatePath("/", "layout");
    return { error: null };
  }

  async function addValue(
    prevState: { error: string | null },
    formData: FormData
  ): Promise<{ error: string | null }> {
    "use server";
    const locale = await getLocale();
    const t = dictionary[locale];

    const name = formData.get("name");
    const color = formData.get("color");

    if (typeof name !== "string" || name.trim() === "") {
      return { error: t.sheet.nameRequiredError };
    }
    if (typeof color !== "string" || color.trim() === "") {
      return { error: t.sheet.colorRequiredError };
    }

    const trimmedName = name.trim();

    if (sheet!.values.length >= MAX_VALUES_PER_SHEET) {
      return { error: t.sheet.valueLimitReached(MAX_VALUES_PER_SHEET) };
    }

    const nameTaken = sheet!.values.some((v) => v.name === trimmedName);
    if (nameTaken) {
      return { error: t.sheet.valueNameExistsError(trimmedName) };
    }

    const tooSimilar = sheet!.values.some(
      (existing) => colorDistance(existing.color, color) < MIN_COLOR_DISTANCE
    );
    if (tooSimilar) {
      return { error: t.sheet.colorTooSimilarError };
    }

    // Nova hodnota ide na koniec palety (za doteraz posledne poradie).
    const nextOrder = Math.max(-1, ...sheet!.values.map((v) => v.order)) + 1;

    try {
      await prisma.value.create({
        data: { sheetId: sheet!.id, name: trimmedName, color, order: nextOrder },
      });
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
        return { error: t.sheet.valueNameExistsError(trimmedName) };
      }
      throw error;
    }

    revalidatePath(`/sheets/${sheet!.id}`);
    return { error: null };
  }

  // Bod 3.22: vymazanie hodnoty. Pokial nie je hodnota nikde v mriezke
  // pouzita, jednoducho sa vymaze (ziadne potvrdenie - to uz riesi klient,
  // pozri LegendValueRow). Pokial P vybral nahradu (replacementValueId),
  // najprv sa VSETKY jej vyskyty v Pixel preradia na nahradnu hodnotu a az
  // potom sa samotna hodnota vymaze - v tomto poradi preto, lebo po vymazani
  // uz "onDelete: SetNull" na Pixel.value vsetky vyskyty vynuluje a nebolo
  // by co preradit. Bez nahrady (replacementValueId == null) sa spolieha
  // prave na tento SetNull - vysledok je rovnaky ako "vyprazdnenie policok".
  async function deleteValue(valueId: string, replacementValueId?: string | null) {
    "use server";
    if (replacementValueId) {
      await prisma.$transaction([
        prisma.pixel.updateMany({
          where: { sheetId: sheet!.id, valueId },
          data: { valueId: replacementValueId },
        }),
        // deleteMany (nie delete) + sheetId v podmienke = nikdy nezmaze
        // hodnotu z cudzieho ineho sheetu, aj keby niekto poslal cudzie id.
        prisma.value.deleteMany({
          where: { id: valueId, sheetId: sheet!.id },
        }),
      ]);
    } else {
      await prisma.value.deleteMany({
        where: { id: valueId, sheetId: sheet!.id },
      });
    }
    revalidatePath(`/sheets/${sheet!.id}`);
  }

  // Bod 3.21: zmena farby ALEBO nazvu uz existujucej hodnoty v legende (v
  // edit rezime) - predtym sa oboje dalo nastavit len raz, pri vytvoreni.
  // Rovnaka kontrola "prilis podobnej farby"/"rovnaky nazov" ako v
  // addValue, len vynima samu seba (inak by hodnota vzdy "kolidovala" sama
  // so sebou).
  async function updateValueColor(
    valueId: string,
    color: string
  ): Promise<{ error: string | null }> {
    "use server";
    const locale = await getLocale();
    const t = dictionary[locale];
    const tooSimilar = sheet!.values.some(
      (existing) =>
        existing.id !== valueId && colorDistance(existing.color, color) < MIN_COLOR_DISTANCE
    );
    if (tooSimilar) {
      return { error: t.sheet.colorTooSimilarError };
    }

    await prisma.value.updateMany({
      where: { id: valueId, sheetId: sheet!.id },
      data: { color },
    });
    revalidatePath(`/sheets/${sheet!.id}`);
    return { error: null };
  }

  async function updateValueName(
    valueId: string,
    name: string
  ): Promise<{ error: string | null }> {
    "use server";
    const locale = await getLocale();
    const t = dictionary[locale];
    const trimmedName = name.trim();
    if (trimmedName === "") {
      return { error: t.sheet.nameRequiredError };
    }

    const nameTaken = sheet!.values.some(
      (v) => v.id !== valueId && v.name === trimmedName
    );
    if (nameTaken) {
      return { error: t.sheet.valueNameExistsError(trimmedName) };
    }

    try {
      await prisma.value.updateMany({
        where: { id: valueId, sheetId: sheet!.id },
        data: { name: trimmedName },
      });
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
        return { error: t.sheet.valueNameExistsError(trimmedName) };
      }
      throw error;
    }

    revalidatePath(`/sheets/${sheet!.id}`);
    return { error: null };
  }

  // Nove poradie hodnot v palete (tahanie v edit rezime) - rovnaky princip
  // ako reorderSheets v sheet-actions.ts. sheetId v podmienke = nikdy
  // nepreusporiada hodnoty cudzieho sheetu, aj keby niekto poslal cudzie id.
  async function reorderValues(orderedIds: string[]) {
    "use server";
    await prisma.$transaction(
      orderedIds.map((valueId, index) =>
        prisma.value.updateMany({
          where: { id: valueId, sheetId: sheet!.id },
          data: { order: index },
        })
      )
    );
    revalidatePath(`/sheets/${sheet!.id}`);
  }

  async function setPixel(month: number, day: number, valueId: string | null) {
    "use server";
    await prisma.pixel.upsert({
      where: { sheetId_day_month: { sheetId: sheet!.id, day, month } },
      create: { sheetId: sheet!.id, day, month, valueId },
      update: { valueId },
    });
    revalidatePath(`/sheets/${sheet!.id}`);
  }

  return (
    <SheetPageShell
      sheetId={sheet.id}
      sheets={sheets}
      createSheet={createSheet}
      reorderSheets={reorderSheets}
      deleteSheet={deleteSheet}
    >
      <SheetEditor
        sheetId={sheet.id}
        sheetName={sheet.name}
        renameSheet={renameSheet}
        deleteSheet={deleteSheet}
        values={sheet.values}
        initialPixels={sheet.pixels}
        setPixel={setPixel}
        deleteValue={deleteValue}
        addValue={addValue}
        updateValueColor={updateValueColor}
        updateValueName={updateValueName}
        reorderValues={reorderValues}
        year={sheet.year}
        initialView={initialView}
      />
    </SheetPageShell>
  );
}

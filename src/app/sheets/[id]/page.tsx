import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";
import { getSheetSummaries } from "@/lib/sheets";
import { colorDistance, MIN_COLOR_DISTANCE } from "@/lib/color";
import { createSheet } from "@/app/sheet-actions";
import { SheetEditor } from "./pixel-grid";
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

  // Dolezite: hladame sheet AJ podla userId. Nestaci hladat len podla id,
  // inak by si (po pridani prihlasovania) mohla nacitat cudzi sheet len
  // uhadnutim jeho id v URL.
  const sheet = await prisma.sheet.findFirst({
    where: { id, userId: user.id },
    include: {
      values: { orderBy: { name: "asc" } },
      pixels: true,
    },
  });
  // sheet.year: cislo roku (napr. 2028) alebo null pre stare sheety bez
  // roku - vyuzije sa na spravny pocet dni vo februari (priestupny rok).

  if (!sheet) notFound();

  const sheets = await getSheetSummaries(user.id);

  async function addValue(
    prevState: { error: string | null },
    formData: FormData
  ): Promise<{ error: string | null }> {
    "use server";

    const name = formData.get("name");
    const color = formData.get("color");

    if (typeof name !== "string" || name.trim() === "") {
      return { error: "Zadaj názov." };
    }
    if (typeof color !== "string" || color.trim() === "") {
      return { error: "Vyber farbu." };
    }

    const trimmedName = name.trim();

    const nameTaken = sheet!.values.some((v) => v.name === trimmedName);
    if (nameTaken) {
      return { error: `Hodnota s názvom „${trimmedName}" už existuje.` };
    }

    const tooSimilar = sheet!.values.some(
      (existing) => colorDistance(existing.color, color) < MIN_COLOR_DISTANCE
    );
    if (tooSimilar) {
      return { error: "Táto farba je príliš podobná už použitej farbe v tomto sheete." };
    }

    try {
      await prisma.value.create({
        data: { sheetId: sheet!.id, name: trimmedName, color },
      });
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
        return { error: `Hodnota s názvom „${trimmedName}" už existuje.` };
      }
      throw error;
    }

    revalidatePath(`/sheets/${sheet!.id}`);
    return { error: null };
  }

  async function deleteValue(valueId: string) {
    "use server";
    // deleteMany (nie delete) + sheetId v podmienke = nikdy nezmaze
    // hodnotu z ciheho ineho sheetu, aj keby niekto poslal cudzie id.
    await prisma.value.deleteMany({
      where: { id: valueId, sheetId: sheet!.id },
    });
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
      sheetName={sheet.name}
      sheets={sheets}
      createSheet={createSheet}
    >
      <SheetEditor
        values={sheet.values}
        initialPixels={sheet.pixels}
        setPixel={setPixel}
        deleteValue={deleteValue}
        addValue={addValue}
        year={sheet.year}
      />
    </SheetPageShell>
  );
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";

export type CreateSheetState = { error: string | null };
export type CreateSheetAction = (
  prevState: CreateSheetState,
  formData: FormData
) => Promise<CreateSheetState>;

// Zdielana Server Action - pouziva ju formular na hlavnej stranke aj
// formular v "menu sheetov" na stranke sheetu (bod 3.11), takze je tu
// definovana raz namiesto kopirovania na dvoch miestach.
export async function createSheet(
  prevState: CreateSheetState,
  formData: FormData
): Promise<CreateSheetState> {
  const name = formData.get("name");
  if (typeof name !== "string" || name.trim() === "") {
    return { error: "Zadaj názov." };
  }
  const trimmedName = name.trim();

  const yearRaw = formData.get("year");
  const year =
    typeof yearRaw === "string" && yearRaw.trim() !== "" && !Number.isNaN(Number(yearRaw))
      ? Number(yearRaw)
      : null;

  const user = await getCurrentUser();

  let newSheet;
  try {
    newSheet = await prisma.sheet.create({
      data: { name: trimmedName, year, userId: user.id },
    });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return { error: `Sheet s názvom „${trimmedName}" už existuje.` };
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

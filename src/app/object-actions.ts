"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";
import { getLocale } from "@/lib/locale";
import { dictionary } from "@/i18n/dictionary";

export type CreateCategoryState = { error: string | null };
export type CreateCategoryAction = (
  prevState: CreateCategoryState,
  formData: FormData
) => Promise<CreateCategoryState>;
export type ReorderCategoriesAction = (orderedIds: string[]) => Promise<void>;
export type DeleteCategoryAction = (categoryId: string) => Promise<void>;

// Zdielana Server Action - pouziva ju formular na hlavnej stranke aj
// formular v "menu kategorii" na stranke kategorie (bod 4.11/4.12), takze je
// tu definovana raz namiesto kopirovania na dvoch miestach. Analogicke ku
// createSheet v sheet-actions.ts.
export async function createCategory(
  prevState: CreateCategoryState,
  formData: FormData
): Promise<CreateCategoryState> {
  const locale = await getLocale();
  const t = dictionary[locale];
  const name = formData.get("name");
  if (typeof name !== "string" || name.trim() === "") {
    return { error: t.object.nameRequiredError };
  }
  const trimmedName = name.trim();

  const user = await getCurrentUser();

  // Nova kategoria ide na koniec zoznamu (FIFO) - o 1 vyssie ako aktualne
  // najvyssie "order" tohto usera.
  const lastCategory = await prisma.objCategory.findFirst({
    where: { userId: user.id },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  const order = (lastCategory?.order ?? -1) + 1;

  let newCategory;
  try {
    newCategory = await prisma.objCategory.create({
      data: { name: trimmedName, userId: user.id, order, template: [] },
    });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return { error: t.object.categoryNameExistsError(trimmedName) };
    }
    throw error;
  }

  // "layout" revaliduje vsetky stranky pod root layoutom, takze sa nova
  // kategoria objavi aj na hlavnej stranke aj v "menu kategorii" otvorenom
  // z inej stranky kategorie.
  revalidatePath("/", "layout");

  // Bod 4.12: po stlaceni "Create" S vytvori kategoriu a P rovno presunie
  // na jej stranku - tam uz je pripravene tlacidlo na pridanie atributu
  // (4.31), takze to nemusime duplikovat v tomto okne.
  redirect(`/objects/${newCategory.id}`);
}

// Bod 4.14: presunutim (drag & drop) v menu kategorii zmeni P poradie -
// rovnaky mechanizmus ako reorderSheets v sheet-actions.ts.
export async function reorderCategories(orderedIds: string[]) {
  "use server";
  const user = await getCurrentUser();

  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.objCategory.updateMany({
        where: { id, userId: user.id },
        data: { order: index },
      })
    )
  );

  revalidatePath("/", "layout");
}

// Bod: vymazanie kategorie z "menu kategorii" (analogicke ku deleteSheet v
// sheet-actions.ts) - popri uz existujucom "Vymazať kategóriu" na vlastnej
// stranke kategorie (objects/[categoryId]/page.tsx), aby sa dalo mazat aj
// bez toho, aby sa do kategorie muselo najprv vojst. deleteMany + userId v
// podmienke = nikdy nezmaze cudziu kategoriu, aj keby niekto poslal cudzie
// id. Cascaduje aj jej objekty a atributy (rovnako ako ta na vlastnej
// stranke).
export async function deleteCategoryById(categoryId: string): Promise<void> {
  "use server";
  const user = await getCurrentUser();
  await prisma.objCategory.deleteMany({
    where: { id: categoryId, userId: user.id },
  });
  revalidatePath("/", "layout");
}

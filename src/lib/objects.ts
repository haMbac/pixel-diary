import { prisma } from "@/lib/prisma";

// "AttributeValueType"/"RatingDisplay"/"AttributeSchema" ziju v samostatnom
// dependency-free subore (src/lib/attribute-schema.ts), pretoze klientske
// komponenty potrebuju importovat "isFeatured" ako SKUTOCNU hodnotu (nie
// len typ) - a tento subor tu importuje "prisma" (server-only). Tu sa len
// znova exportuju (type-only, teda bez runtime vplyvu) kvoli spatnej
// kompatibilite s existujucimi "import type {...} from '@/lib/objects'".
export type { AttributeValueType, RatingDisplay, AttributeSchema } from "./attribute-schema";
import type { AttributeSchema, RatingDisplay } from "./attribute-schema";

export type TileRating = {
  value: number;
  scale: number;
  display: RatingDisplay;
};

export type CategorySummary = {
  id: string;
  name: string;
  order: number;
  template: AttributeSchema[];
  objectCount: number;
  // "icon" = surova ikona NASTAVENA NA KATEGORII (pre edit UI v
  // CategoryNameHeader) - sluzi len ako fallback, ked kategoria zatial
  // nema objekty alebo najnovsi objekt vlastnu ikonu nema.
  icon: string | null;
  // Nasledujuce "tile*" polia opisuju NAJNOVSI OBJEKT kategorie (bod:
  // "kategoria je reprezentovana najnovsie pridanym objektom") - ikona,
  // meno aj hodnotenie tak, ako sa maju zobrazit na dlazdici. Kategoria bez
  // objektov ma vsetky okrem "tileIcon" prazdne (tileIcon vtedy padne na
  // "icon" kategorie, inak na generickú "folder" ikonu v resolveIcon).
  tileIcon: string | null;
  tileObjectName: string | null;
  tileRating: TileRating | null;
};

// Spolocne pre hlavnu stranku aj pre "menu kategorii" na stranke kategorie
// (analogicky ku getSheetSummaries a bodu 4.11 vo funkcnej specifikacii) -
// obe potrebuju ten isty zoznam kategorii so zjednodusenymi datami pre
// dlazdice, bez toho aby sa dopytovanie pisalo dvakrat.
export async function getCategorySummaries(userId: string): Promise<CategorySummary[]> {
  const categoriesRaw = await prisma.objCategory.findMany({
    where: { userId },
    orderBy: { order: "asc" },
    select: {
      id: true,
      name: true,
      order: true,
      template: true,
      icon: true,
      _count: { select: { objects: true } },
      // Len najnovsi objekt (podla vytvorenia) - bod 4.11: "kategoria je
      // reprezentovana najnovsie pridanym objektom".
      objects: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          name: true,
          icon: true,
          attributes: {
            select: { type: true, value: true, ratingScale: true },
          },
        },
      },
    },
  });

  return categoriesRaw.map((category) => {
    const template = (category.template as AttributeSchema[] | null) ?? [];
    const latest = category.objects[0];
    // "ratingDisplay" (hviezdy/cislo) je ulozene len v sablone kategorie,
    // nie na samotnom Attribute riadku - preto sa dopyta odtial.
    const ratingSchema = template.find((t) => t.type === "RATING");
    const ratingAttr = latest?.attributes.find((a) => a.type === "RATING" && a.value != null);
    const tileRating: TileRating | null = ratingAttr
      ? {
          value: Number(ratingAttr.value) || 0,
          scale: ratingAttr.ratingScale ?? 5,
          display: ratingSchema?.ratingDisplay ?? "stars",
        }
      : null;

    return {
      id: category.id,
      name: category.name,
      order: category.order,
      template,
      objectCount: category._count.objects,
      icon: category.icon,
      tileIcon: latest?.icon ?? category.icon,
      tileObjectName: latest?.name ?? null,
      tileRating,
    };
  });
}

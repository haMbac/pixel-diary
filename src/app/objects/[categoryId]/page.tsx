import { randomUUID } from "node:crypto";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";
import { getLocale } from "@/lib/locale";
import { dictionary } from "@/i18n/dictionary";
import {
  getCategorySummaries,
  type AttributeSchema,
  type AttributeValueType,
  type RatingDisplay,
} from "@/lib/objects";
import { createCategory, reorderCategories, deleteCategoryById } from "@/app/object-actions";
import { CategoryEditor, type ObjectData } from "./category-editor";
import { ObjectPageShell } from "./object-page-shell";

type ActionState = { error: string | null };

function readAttrValue(formData: FormData, attr: AttributeSchema): string | null {
  const raw = formData.get(`attr_${attr.id}`);
  if (typeof raw !== "string" || raw.trim() === "") return null;
  return raw;
}

function readAttributeType(formData: FormData): AttributeValueType | null {
  const type = formData.get("type");
  if (type === "TEXT" || type === "NUMBER" || type === "RATING") return type;
  return null;
}

function readRatingScale(formData: FormData, type: AttributeValueType): 5 | 10 | undefined {
  if (type !== "RATING") return undefined;
  return Number(formData.get("ratingScale")) === 10 ? 10 : 5;
}

function readRatingDisplay(
  formData: FormData,
  type: AttributeValueType
): RatingDisplay | undefined {
  if (type !== "RATING") return undefined;
  return formData.get("ratingDisplay") === "number" ? "number" : "stars";
}

// HTML checkboxy neposielaju ziadnu hodnotu vobec, ked su odskrtnute -
// pritomnost/neprítomnost pola "featured" v odoslanych datach JE odpoved.
function readFeatured(formData: FormData): boolean {
  return formData.get("featured") != null;
}

// Prazdny string (skryte pole "icon" bez vybratej hodnoty) = ziadny
// override, objekt zdedi ikonu kategorie (pozri IconPicker "allowClear").
function readIconValue(formData: FormData): string | null {
  const raw = formData.get("icon");
  if (typeof raw !== "string" || raw.trim() === "") return null;
  return raw;
}

// V Next.js 16 su URL parametre (tu [categoryId]) asynchronne - preto
// `params` je Promise a musime ho najprv "await"-nut. Rovnaka struktura ako
// src/app/sheets/[id]/page.tsx (bod 3.11), len pre kategorie (bod 4.11).
export default async function ObjectCategoryPage({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}) {
  const { categoryId } = await params;
  const user = await getCurrentUser();

  // Dolezite: hladame kategoriu AJ podla userId - inak by sa dala nacitat
  // cudzia kategoria len uhadnutim jej id v URL.
  const category = await prisma.objCategory.findFirst({
    where: { id: categoryId, userId: user.id },
    include: {
      objects: {
        orderBy: { createdAt: "asc" },
        include: { attributes: true },
      },
    },
  });

  if (!category) notFound();

  const template = (category.template as AttributeSchema[] | null) ?? [];
  const categories = await getCategorySummaries(user.id);

  // Bod 4.13: premenovanie kategorie.
  async function renameCategory(
    prevState: ActionState,
    formData: FormData
  ): Promise<ActionState> {
    "use server";
    const locale = await getLocale();
    const t = dictionary[locale];
    const name = formData.get("name");
    if (typeof name !== "string" || name.trim() === "") {
      return { error: t.object.nameRequiredError };
    }
    const trimmedName = name.trim();

    try {
      await prisma.objCategory.updateMany({
        where: { id: category!.id, userId: user.id },
        data: { name: trimmedName },
      });
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
        return { error: t.object.categoryNameExistsError(trimmedName) };
      }
      throw error;
    }

    revalidatePath(`/objects/${category!.id}`);
    revalidatePath("/", "layout");
    return { error: null };
  }

  // Bod 4.14: vymazanie kategorie (cascaduje aj jej objekty a atributy).
  async function deleteCategory() {
    "use server";
    await prisma.objCategory.deleteMany({
      where: { id: category!.id, userId: user.id },
    });
    revalidatePath("/", "layout");
  }

  // Ikona kategorie - dlazdica na hlavnej stranke aj v menu kategorii ju
  // zobrazuje namiesto textoveho nazvu/poctu (pozri IconPicker).
  async function setCategoryIcon(value: string | null) {
    "use server";
    await prisma.objCategory.updateMany({
      where: { id: category!.id, userId: user.id },
      data: { icon: value },
    });
    revalidatePath(`/objects/${category!.id}`);
    revalidatePath("/", "layout");
  }

  // Bod 4.31: novy atribut sa prida do sablony kategorie A zaroven dostane
  // (prazdny) Attribute riadok na kazdom uz existujucom objekte, aby mal
  // kazdy objekt hned "slot" na vyplnenie. Sablona sa vzdy najprv nacita
  // znova (nie zo starej closure) - inak by sa pri dvoch prekryvajucich sa
  // upravach sablony mohla jedna z nich stratit.
  async function addAttribute(
    prevState: ActionState,
    formData: FormData
  ): Promise<ActionState> {
    "use server";
    const locale = await getLocale();
    const t = dictionary[locale];
    const name = formData.get("name");
    if (typeof name !== "string" || name.trim() === "") {
      return { error: t.object.nameRequiredError };
    }
    const trimmedName = name.trim();

    const type = readAttributeType(formData);
    if (!type) return { error: t.object.attributeTypeInvalidError };
    const ratingScale = readRatingScale(formData, type);
    const ratingDisplay = readRatingDisplay(formData, type);
    const featured = readFeatured(formData);

    const current = await prisma.objCategory.findFirst({
      where: { id: category!.id, userId: user.id },
      select: { template: true },
    });
    if (!current) return { error: t.object.categoryNotFoundError };
    const currentTemplate = (current.template as AttributeSchema[] | null) ?? [];

    if (currentTemplate.some((a) => a.name === trimmedName)) {
      return { error: t.object.attributeNameExistsError(trimmedName) };
    }

    const newEntry: AttributeSchema = {
      id: randomUUID(),
      name: trimmedName,
      type,
      featured,
      ...(ratingScale ? { ratingScale } : {}),
      ...(ratingDisplay ? { ratingDisplay } : {}),
    };
    const nextTemplate = [...currentTemplate, newEntry];

    const existingObjects = await prisma.objekt.findMany({
      where: { categoryId: category!.id },
      select: { id: true },
    });

    await prisma.$transaction([
      prisma.objCategory.update({
        where: { id: category!.id },
        data: { template: nextTemplate },
      }),
      prisma.attribute.createMany({
        data: existingObjects.map((o) => ({
          objektId: o.id,
          templateId: newEntry.id,
          name: newEntry.name,
          type: newEntry.type,
          ratingScale: ratingScale ?? null,
          value: null,
        })),
      }),
    ]);

    revalidatePath(`/objects/${category!.id}`);
    return { error: null };
  }

  // Bod 4.32: premenovanie/zmena typu atributu sa premietne do vsetkych
  // jeho vyskytov naprie objektami kategorie. Zmena TYPU navyse vymaze
  // (nastavi na null) doterajsie hodnoty - podla specifikacie ich P musi
  // vyplnit znova, lebo stara hodnota uz nemusi davat zmysel v novom type.
  async function editAttribute(
    prevState: ActionState,
    formData: FormData
  ): Promise<ActionState> {
    "use server";
    const locale = await getLocale();
    const t = dictionary[locale];
    const templateId = formData.get("templateId");
    const name = formData.get("name");
    if (typeof templateId !== "string") return { error: t.object.attributeInvalidError };
    if (typeof name !== "string" || name.trim() === "") {
      return { error: t.object.nameRequiredError };
    }
    const trimmedName = name.trim();

    const type = readAttributeType(formData);
    if (!type) return { error: t.object.attributeTypeInvalidError };
    const ratingScale = readRatingScale(formData, type);
    const ratingDisplay = readRatingDisplay(formData, type);
    const featured = readFeatured(formData);

    const current = await prisma.objCategory.findFirst({
      where: { id: category!.id, userId: user.id },
      select: { template: true },
    });
    if (!current) return { error: t.object.categoryNotFoundError };
    const currentTemplate = (current.template as AttributeSchema[] | null) ?? [];

    const existing = currentTemplate.find((a) => a.id === templateId);
    if (!existing) return { error: t.object.attributeNotFoundError };

    if (currentTemplate.some((a) => a.id !== templateId && a.name === trimmedName)) {
      return { error: t.object.attributeNameExistsError(trimmedName) };
    }

    const typeChanged = existing.type !== type;
    const nextTemplate = currentTemplate.map((a): AttributeSchema =>
      a.id === templateId
        ? {
            id: a.id,
            name: trimmedName,
            type,
            featured,
            ...(ratingScale ? { ratingScale } : {}),
            ...(ratingDisplay ? { ratingDisplay } : {}),
          }
        : a
    );

    const objectIds = (
      await prisma.objekt.findMany({
        where: { categoryId: category!.id },
        select: { id: true },
      })
    ).map((o) => o.id);

    await prisma.$transaction([
      prisma.objCategory.update({
        where: { id: category!.id },
        data: { template: nextTemplate },
      }),
      prisma.attribute.updateMany({
        where: { templateId, objektId: { in: objectIds } },
        data: {
          name: trimmedName,
          type,
          ratingScale: ratingScale ?? null,
          ...(typeChanged ? { value: null } : {}),
        },
      }),
    ]);

    revalidatePath(`/objects/${category!.id}`);
    return { error: null };
  }

  // Bod 4.33: vymazanie atributu odstrani jeho definiciu zo sablony AJ
  // vsetky jeho vyskyty naprie objektami kategorie (bez potvrdenia - S
  // "neupozorňuje", presne podla specifikacie).
  async function deleteAttribute(templateId: string) {
    "use server";
    const current = await prisma.objCategory.findFirst({
      where: { id: category!.id, userId: user.id },
      select: { template: true },
    });
    if (!current) return;
    const currentTemplate = (current.template as AttributeSchema[] | null) ?? [];
    const nextTemplate = currentTemplate.filter((a) => a.id !== templateId);

    const objectIds = (
      await prisma.objekt.findMany({
        where: { categoryId: category!.id },
        select: { id: true },
      })
    ).map((o) => o.id);

    await prisma.$transaction([
      prisma.objCategory.update({
        where: { id: category!.id },
        data: { template: nextTemplate },
      }),
      prisma.attribute.deleteMany({
        where: { templateId, objektId: { in: objectIds } },
      }),
    ]);

    revalidatePath(`/objects/${category!.id}`);
  }

  // Bod 4.21: novy objekt dostane hned jeden Attribute riadok pre kazdy
  // atribut aktualnej sablony (hodnoty vyplnene z formulara, resp. null ak
  // P nechal pole prazdne).
  async function createObject(
    prevState: ActionState,
    formData: FormData
  ): Promise<ActionState> {
    "use server";
    const locale = await getLocale();
    const t = dictionary[locale];
    const name = formData.get("name");
    if (typeof name !== "string" || name.trim() === "") {
      return { error: t.object.nameRequiredError };
    }
    const trimmedName = name.trim();

    try {
      await prisma.objekt.create({
        data: {
          name: trimmedName,
          categoryId: category!.id,
          icon: readIconValue(formData),
          attributes: {
            create: template.map((attr) => ({
              templateId: attr.id,
              name: attr.name,
              type: attr.type,
              ratingScale: attr.ratingScale ?? null,
              value: readAttrValue(formData, attr),
            })),
          },
        },
      });
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
        return { error: t.object.objectNameExistsError(trimmedName) };
      }
      throw error;
    }

    revalidatePath(`/objects/${category!.id}`);
    return { error: null };
  }

  // Bod 4.22: upravenie objektu - premenuje ho a prepise hodnotu kazdeho
  // atributu sablony (existujuci Attribute riadok, vytvoreny uz pri 4.21).
  async function updateObject(
    prevState: ActionState,
    formData: FormData
  ): Promise<ActionState> {
    "use server";
    const locale = await getLocale();
    const t = dictionary[locale];
    const objektId = formData.get("objektId");
    const name = formData.get("name");
    if (typeof objektId !== "string") return { error: t.object.objectInvalidError };
    if (typeof name !== "string" || name.trim() === "") {
      return { error: t.object.nameRequiredError };
    }
    const trimmedName = name.trim();

    try {
      await prisma.$transaction([
        prisma.objekt.updateMany({
          where: { id: objektId, categoryId: category!.id },
          data: { name: trimmedName, icon: readIconValue(formData) },
        }),
        ...template.map((attr) =>
          prisma.attribute.updateMany({
            where: { objektId, templateId: attr.id },
            data: { value: readAttrValue(formData, attr) },
          })
        ),
      ]);
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
        return { error: t.object.objectNameExistsError(trimmedName) };
      }
      throw error;
    }

    revalidatePath(`/objects/${category!.id}`);
    return { error: null };
  }

  // Bod 4.23: vymazanie objektu (bez potvrdenia - S "neoveruje", presne
  // podla specifikacie). Cascade v schema.prisma zmaze aj jeho Attribute
  // riadky.
  async function deleteObject(objektId: string) {
    "use server";
    await prisma.objekt.deleteMany({
      where: { id: objektId, categoryId: category!.id },
    });
    revalidatePath(`/objects/${category!.id}`);
  }

  const objects: ObjectData[] = category.objects.map((obj) => ({
    id: obj.id,
    name: obj.name,
    // "icon" (efektivna, na zobrazenie v riadku) padne na ikonu kategorie,
    // ked objekt vlastnu nema; "ownIcon" (surova, bez fallbacku) je pre
    // IconPicker v edit formulari objektu (bod: "allowClear").
    icon: obj.icon ?? category.icon,
    ownIcon: obj.icon,
    attributes: template.map((attr) => {
      const found = obj.attributes.find((a) => a.templateId === attr.id);
      return {
        templateId: attr.id,
        name: attr.name,
        type: attr.type,
        ratingScale: attr.ratingScale ?? null,
        ratingDisplay: attr.ratingDisplay ?? null,
        featured: attr.featured ?? null,
        value: found?.value ?? null,
      };
    }),
  }));

  return (
    <ObjectPageShell
      categoryId={category.id}
      categories={categories}
      createCategory={createCategory}
      reorderCategories={reorderCategories}
      deleteCategory={deleteCategoryById}
    >
      <CategoryEditor
        categoryName={category.name}
        categoryIcon={category.icon}
        setCategoryIcon={setCategoryIcon}
        template={template}
        objects={objects}
        renameCategory={renameCategory}
        deleteCategory={deleteCategory}
        addAttribute={addAttribute}
        editAttribute={editAttribute}
        deleteAttribute={deleteAttribute}
        createObject={createObject}
        updateObject={updateObject}
        deleteObject={deleteObject}
      />
    </ObjectPageShell>
  );
}

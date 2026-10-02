"use client";

import { useRouter } from "next/navigation";
import { useT } from "@/i18n/context";
import { ObjectsCarousel } from "./objects-carousel";
import type { CategorySummary } from "@/lib/objects";
import type { CreateCategoryAction } from "./object-actions";

const CARD_BORDER = "var(--border)";

// Klik na vyplnu/ram karty (mimo konkretnej dlazdice) vedie na prvu
// kategoriu v zozname - rovnaky vzor ako SheetsSection.
export function ObjectsSection({
  categories,
  createCategory,
}: {
  categories: CategorySummary[];
  createCategory: CreateCategoryAction;
}) {
  const router = useRouter();
  const t = useT();

  function goToFirstCategory() {
    if (categories.length > 0) {
      router.push(`/objects/${categories[0].id}`);
    }
  }

  return (
    <section
      onClick={goToFirstCategory}
      style={{
        border: `2px solid ${CARD_BORDER}`,
        borderRadius: 7,
        backgroundColor: "var(--card-fill)",
        cursor: categories.length > 0 ? "pointer" : "default",
        marginLeft: "auto",
        marginRight: "auto",
      }}
      className="p-4 section-width"
    >
      <h2 className="text-lg font-medium mb-3 px-1">{t.home.objectsHeading}</h2>
      <ObjectsCarousel categories={categories} createCategory={createCategory} />
    </section>
  );
}

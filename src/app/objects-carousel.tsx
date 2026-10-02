"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import type { CategorySummary } from "@/lib/objects";
import type { CreateCategoryAction } from "./object-actions";
import { IconGlyph } from "./icon-glyph";
import { ChevronLeftIcon, ChevronRightIcon } from "./ui-icons";
import { useT } from "@/i18n/context";

export const CATEGORY_TILE_WIDTH = 160;
// Ikona je stvorcova a ma vyplnit takmer cely nazov dlazdice (bod: "nech sa
// ikona zmesti"); dlazdica je preto vyssia nez siroka - pod ikonou este
// zostane miesto na meno + hodnotenie najnovsieho objektu.
export const CATEGORY_ICON_SIZE = 128;
export const CATEGORY_TILE_HEIGHT = 196;
export const PINK_BORDER = "var(--border)";

// Dlazdica kategorie ukazuje najnovsi pridany objekt - jeho ikonu/fotku,
// meno a hodnotenie (ak ho kategoria ma). Samotna kategoria (jej vlastny
// nazov "knihy" a pod.) sa NEZOBRAZUJE textom - identitu nesie ikona;
// nazov kategorie ostava len ako title/aria-label na obalujucom <Link>.
export function CategoryPreview({ category }: { category: CategorySummary }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-1 p-2">
      <div
        style={{
          width: CATEGORY_ICON_SIZE,
          height: CATEGORY_ICON_SIZE,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <IconGlyph value={category.tileIcon} />
      </div>
      {category.tileObjectName && (
        <span className="text-xs font-medium truncate w-full text-center">
          {category.tileObjectName}
        </span>
      )}
      {category.tileRating && (
        <span className="text-xs leading-none" style={{ color: "var(--accent)" }}>
          {category.tileRating.display === "number"
            ? `${category.tileRating.value}/${category.tileRating.scale}`
            : "★".repeat(category.tileRating.value) +
              "☆".repeat(category.tileRating.scale - category.tileRating.value)}
        </span>
      )}
    </div>
  );
}

export function ObjectsCarousel({
  categories,
  createCategory,
}: {
  categories: CategorySummary[];
  createCategory: CreateCategoryAction;
}) {
  const t = useT();
  const scrollRef = useRef<HTMLDivElement>(null);
  // Sipky sa ukazu len ked sa vsetky dlazdice do riadku nezmestia (obsah je
  // sirsi ako kontajner) - rovnaky mechanizmus ako v SheetsCarousel.
  const [canScroll, setCanScroll] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    function checkOverflow() {
      if (!el) return;
      setCanScroll(el.scrollWidth > el.clientWidth + 1);
    }

    checkOverflow();
    const observer = new ResizeObserver(checkOverflow);
    observer.observe(el);
    return () => observer.disconnect();
  }, [categories.length]);

  function scroll(direction: 1 | -1) {
    scrollRef.current?.scrollBy({ left: direction * 260, behavior: "smooth" });
  }

  return (
    <div className="relative">
      {canScroll && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            scroll(-1);
          }}
          aria-label={t.objectsBrowse.prevCategoriesLabel}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 p-1 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--ink)]"
        >
          <ChevronLeftIcon />
        </button>
      )}

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scroll-smooth py-1"
        style={{ scrollbarWidth: "none" }}
      >
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/objects/${category.id}`}
            onClick={(e) => e.stopPropagation()}
            title={category.name}
            aria-label={category.name}
            className="shrink-0 flex flex-col items-center justify-center hover:shadow-sm transition-shadow"
            style={{
              width: CATEGORY_TILE_WIDTH,
              height: CATEGORY_TILE_HEIGHT,
              borderRadius: 16,
              border: `2px solid ${PINK_BORDER}`,
              background: "#fff",
            }}
          >
            <CategoryPreview category={category} />
          </Link>
        ))}

        <AddCategoryTile createCategory={createCategory} />
      </div>

      {canScroll && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            scroll(1);
          }}
          aria-label={t.objectsBrowse.nextCategoriesLabel}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 p-1 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--ink)]"
        >
          <ChevronRightIcon />
        </button>
      )}
    </div>
  );
}

// Bod 4.12: klik na poslednu polozku "+" (na hlavnej stranke aj v "menu
// kategorii") otvori OKNO (modal) na vytvorenie novej kategorie - dlazdica
// sama je len tlacidlo, formular je az v prekryvnom okne. Kategoria sa tu
// vytvara LEN s nazvom (bez sablony/atributov) - tie sa pridavaju az
// nasledne na jej stranke (bod 4.31), rovnako ako hodnoty pri sheetoch.
export function AddCategoryTile({ createCategory }: { createCategory: CreateCategoryAction }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createCategory, {
    error: null,
  });

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        style={{
          width: CATEGORY_TILE_WIDTH,
          height: CATEGORY_TILE_HEIGHT,
          borderRadius: 16,
          border: `2px dashed ${PINK_BORDER}`,
          color: "var(--accent)",
        }}
        className="shrink-0 flex flex-col items-center justify-center gap-1 p-2"
      >
        <span className="text-3xl leading-none">+</span>
        <span className="text-xs text-gray-400">{t.objectsBrowse.newCategoryLabel}</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-30"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ border: `2px solid ${PINK_BORDER}`, borderRadius: 20 }}
            className="bg-white p-6 max-w-sm w-full"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">{t.objectsBrowse.newCategoryLabel}</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t.objectsBrowse.closeLabel}
                title={t.objectsBrowse.closeLabel}
                className="text-gray-400 hover:text-gray-600 text-sm"
              >
                ✕
              </button>
            </div>
            <form action={formAction} className="flex flex-col gap-3">
              <label className="text-sm text-gray-600">
                {t.objectsBrowse.nameLabel}
                <input
                  type="text"
                  name="name"
                  placeholder={t.objectsBrowse.namePlaceholder}
                  className="mt-1 w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]"
                />
              </label>
              {state.error && <p className="text-red-600 text-sm">{state.error}</p>}
              <button
                type="submit"
                disabled={isPending}
                className="bg-black text-white rounded px-4 py-2 text-sm disabled:opacity-50 mt-2"
              >
                {isPending ? t.objectsBrowse.creatingButton : t.objectsBrowse.createButton}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

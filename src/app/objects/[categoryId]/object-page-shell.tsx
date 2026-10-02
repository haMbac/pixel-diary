"use client";

import Link from "next/link";
import { useState } from "react";
import type { ReactNode } from "react";
import { useT } from "@/i18n/context";
import type { CategorySummary } from "@/lib/objects";
import type {
  CreateCategoryAction,
  ReorderCategoriesAction,
  DeleteCategoryAction,
} from "../../object-actions";
import { ObjectsGrid } from "../../objects-grid";
import { EditModeProvider } from "../../edit-mode-context";
import { BackArrowIcon, ChevronLeftIcon, ChevronRightIcon, EditIcon, MenuIcon } from "../../ui-icons";

const PINK_BORDER = "var(--border)";

// Stranka kategorie podla bodu 4.11 funkcnej specifikacie - rovnaka
// struktura ako SheetPageShell (3.11), len bez PDF exportu (v sekcii 4 nie
// je spec'ovany):
// - vlavo hore sipka spat na hlavnu stranku
// - vpravo hore tlacidlo "✎" prepina edit rezim (cez zdielany
//   EditModeContext) - riadi viditelnost premenovania/mazania kategorie a
//   pridavania/upravovania/mazania atributov a objektov
// - spodna lista s ikonou "menu kategorii", ktora otvori MRIEZKU KATEGORII
//   (nie objektov tejto kategorie - preto sa nazyva "Kategórie", nie
//   "Objekty"), aby sa dalo prepinat bez navratu domov - "menu kategorii" ma
//   VLASTNY edit rezim (nezavisly od tohto vyssie), rovnako ako "menu
//   sheetov" v SheetPageShell, ktory odomkne presuvanie poradia a mazanie
//   kategorii priamo v mriezke
export function ObjectPageShell({
  categoryId,
  categories,
  createCategory,
  reorderCategories,
  deleteCategory,
  children,
}: {
  categoryId: string;
  categories: CategorySummary[];
  createCategory: CreateCategoryAction;
  reorderCategories: ReorderCategoriesAction;
  deleteCategory: DeleteCategoryAction;
  children: ReactNode;
}) {
  const t = useT();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [menuEditMode, setMenuEditMode] = useState(false);

  const currentIndex = categories.findIndex((c) => c.id === categoryId);
  const prevCategory = currentIndex > 0 ? categories[currentIndex - 1] : null;
  const nextCategory =
    currentIndex !== -1 && currentIndex < categories.length - 1
      ? categories[currentIndex + 1]
      : null;

  return (
    <main className="mx-auto p-2 sm:p-8 pb-24 sm:pb-24 min-w-0 w-full sheet-page-width">
      <div
        className="flex items-center justify-between mb-2"
        style={{ paddingRight: "var(--lang-switcher-w)" }}
      >
        <Link
          href="/"
          aria-label={t.object.backToHomeTitle}
          title={t.object.backToHomeTitle}
          className="p-2 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--border-hover)] hover:text-[var(--ink)]"
        >
          <BackArrowIcon />
        </Link>
        <button
          type="button"
          onClick={() => setEditMode((v) => !v)}
          aria-pressed={editMode}
          title={editMode ? t.object.exitEditModeTitle : t.object.editButtonTitle}
          className={
            "p-2 flex items-center justify-center rounded-lg " +
            (editMode
              ? "bg-[var(--accent-soft)] text-[var(--accent)]"
              : "text-[var(--text-muted)] hover:bg-[var(--border-hover)] hover:text-[var(--ink)]")
          }
        >
          <EditIcon />
        </button>
      </div>

      <EditModeProvider value={editMode}>{children}</EditModeProvider>

      {/* Sipky na predchadzajucu/nasledujucu kategoriu su v spodnej liste -
          predtym boli fixne v strede okrajov obrazovky a prekryvali okraj
          dlazdic objektov. Prazdne miesto namiesto chybajucej sipky drzi
          ☰ stale v strede. */}
      <div className="bottom-bar">
        {prevCategory ? (
          <Link
            href={`/objects/${prevCategory.id}`}
            aria-label={t.object.previousCategoryTitle}
            title={t.object.previousCategoryWithNameTitle(prevCategory.name)}
            className="p-2 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--border-hover)] hover:text-[var(--ink)]"
          >
            <ChevronLeftIcon />
          </Link>
        ) : (
          <span className="w-[38px]" aria-hidden="true" />
        )}
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label={t.object.categoriesMenuTitle}
          title={t.object.categoriesMenuTitle}
          className="p-2 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--border-hover)] hover:text-[var(--ink)]"
        >
          <MenuIcon />
        </button>
        {nextCategory ? (
          <Link
            href={`/objects/${nextCategory.id}`}
            aria-label={t.object.nextCategoryTitle}
            title={t.object.nextCategoryWithNameTitle(nextCategory.name)}
            className="p-2 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--border-hover)] hover:text-[var(--ink)]"
          >
            <ChevronRightIcon />
          </Link>
        ) : (
          <span className="w-[38px]" aria-hidden="true" />
        )}
      </div>

      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-20"
          onClick={() => setMenuOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ border: `2px solid ${PINK_BORDER}`, borderRadius: 20 }}
            className="bg-white p-4 max-w-lg w-full"
          >
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-lg font-medium">{t.object.categoriesHeading}</h2>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setMenuEditMode((v) => !v)}
                  aria-pressed={menuEditMode}
                  title={menuEditMode ? t.object.exitEditModeTitle : t.object.reorderDeleteModeTitle}
                  className={
                    "p-1.5 flex items-center justify-center rounded-lg " +
                    (menuEditMode
                      ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                      : "text-[var(--text-muted)] hover:bg-[var(--border-hover)] hover:text-[var(--ink)]")
                  }
                >
                  <EditIcon size={20} />
                </button>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  aria-label={t.object.closeButtonTitle}
                  title={t.object.closeButtonTitle}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none p-1"
                >
                  ✕
                </button>
              </div>
            </div>
            <ObjectsGrid
              categories={categories}
              createCategory={createCategory}
              reorderCategories={reorderCategories}
              deleteCategory={deleteCategory}
              editMode={menuEditMode}
              currentCategoryId={categoryId}
            />
          </div>
        </div>
      )}
    </main>
  );
}

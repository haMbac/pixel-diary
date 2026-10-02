"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from "react";
import type { CategorySummary } from "@/lib/objects";
import type {
  CreateCategoryAction,
  ReorderCategoriesAction,
  DeleteCategoryAction,
} from "./object-actions";
import {
  CategoryPreview,
  AddCategoryTile,
  CATEGORY_TILE_WIDTH,
  CATEGORY_TILE_HEIGHT,
  PINK_BORDER,
} from "./objects-carousel";
import { useT } from "@/i18n/context";

const TILE_WIDTH = CATEGORY_TILE_WIDTH;
const TILE_HEIGHT = CATEGORY_TILE_HEIGHT;

// Rovnake hranice/casovanie ako v SheetsGrid (bod 3.14) - pozri komentare
// tam pre plne vysvetlenie. Tu len aplikovane na kategorie namiesto sheetov.
const DRAG_THRESHOLD_MOUSE = 6;
const DRAG_THRESHOLD_TOUCH = 16;
const TOUCH_HOLD_MS = 450;
const TOUCH_HOLD_CANCEL_DISTANCE = 10;

type DragState = { id: string; x: number; y: number; overIndex: number };

// "Menu kategorii" (otvara sa z tlacidla ☰ na stranke kategorie, bod
// 4.11/4.14) - identicky mechanizmus presuvania ako SheetsGrid, len nad
// zoznamom kategorii namiesto sheetov. Pozri SheetsGrid pre podrobne
// komentare k algoritmu (zamerne nekopirovane sem znova).
export function ObjectsGrid({
  categories: categoriesProp,
  createCategory,
  reorderCategories,
  deleteCategory,
  editMode,
  currentCategoryId,
}: {
  categories: CategorySummary[];
  createCategory: CreateCategoryAction;
  reorderCategories: ReorderCategoriesAction;
  deleteCategory: DeleteCategoryAction;
  // Bod: presuvanie poradia AJ mazanie su dostupne len v tomto (menu-
  // lokalnom) edit rezime - rovnaky vzor ako SheetsGrid.
  editMode: boolean;
  // Ak P zmaze prave PREZERANU kategoriu priamo z menu, treba ho
  // presmerovat na hlavnu stranku (jej vlastna stranka by inak 404-la).
  currentCategoryId: string;
}) {
  const t = useT();
  const [categories, setCategories] = useState(categoriesProp);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const [drag, setDrag] = useState<DragState | null>(null);
  const dragRef = useRef<DragState | null>(null);
  useEffect(() => {
    dragRef.current = drag;
  });

  const tileRefs = useRef(new Map<string, HTMLDivElement>());

  useEffect(() => {
    setCategories((current) => (dragRef.current === null ? categoriesProp : current));
  }, [categoriesProp]);

  const justDraggedRef = useRef(false);

  function clearJustDraggedSoon() {
    setTimeout(() => {
      justDraggedRef.current = false;
    }, 0);
  }

  function reset() {
    setDrag(null);
    dragRef.current = null;
  }

  function commitDrop(id: string, overIndex: number) {
    const dragged = categories.find((c) => c.id === id);
    if (!dragged) return;
    const others = categories.filter((c) => c.id !== id);
    const clamped = Math.max(0, Math.min(overIndex, others.length));
    const reordered = [
      ...others.slice(0, clamped),
      dragged,
      ...others.slice(clamped),
    ];
    setCategories(reordered);
    startTransition(() => {
      reorderCategories(reordered.map((c) => c.id));
    });
  }

  function handleDelete(e: ReactMouseEvent, category: CategorySummary) {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(t.objectsBrowse.deleteCategoryConfirm(category.name))) {
      return;
    }
    setCategories((current) => current.filter((c) => c.id !== category.id));
    startTransition(async () => {
      await deleteCategory(category.id);
      if (category.id === currentCategoryId) {
        router.push("/");
      }
    });
  }

  function computeOverIndex(otherIds: string[], clientX: number, clientY: number): number {
    let closestIndex = otherIds.length;
    let closestDist = Infinity;
    let insertBefore = true;

    for (let i = 0; i < otherIds.length; i++) {
      const el = tileRefs.current.get(otherIds[i]);
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dist = Math.hypot(clientX - centerX, clientY - centerY);
      if (dist < closestDist) {
        closestDist = dist;
        closestIndex = i;
        insertBefore = clientX < centerX;
      }
    }

    if (closestIndex === otherIds.length) return otherIds.length;
    return insertBefore ? closestIndex : closestIndex + 1;
  }

  function handlePointerDown(e: ReactPointerEvent<HTMLDivElement>, categoryId: string) {
    if (e.button !== 0 || dragRef.current !== null) return;
    const startX = e.clientX;
    const startY = e.clientY;
    const isTouch = e.pointerType === "touch";
    const threshold = isTouch ? DRAG_THRESHOLD_TOUCH : DRAG_THRESHOLD_MOUSE;
    let unlocked = !isTouch;
    let dragging = false;
    let watchdog: ReturnType<typeof setTimeout> | undefined;
    let unlockTimer: ReturnType<typeof setTimeout> | undefined;

    if (isTouch) {
      unlockTimer = setTimeout(() => {
        unlocked = true;
      }, TOUCH_HOLD_MS);
    }

    function handleMove(ev: PointerEvent) {
      if (!unlocked) {
        if (Math.hypot(ev.clientX - startX, ev.clientY - startY) > TOUCH_HOLD_CANCEL_DISTANCE) {
          cleanup();
        }
        return;
      }
      if (!dragging) {
        if (Math.hypot(ev.clientX - startX, ev.clientY - startY) < threshold) return;
        dragging = true;
        justDraggedRef.current = true;
        watchdog = setTimeout(handleCancel, 15000);
      }
      ev.preventDefault();
      const otherIds = categories.filter((c) => c.id !== categoryId).map((c) => c.id);
      const overIndex = computeOverIndex(otherIds, ev.clientX, ev.clientY);
      const next = { id: categoryId, x: ev.clientX, y: ev.clientY, overIndex };
      dragRef.current = next;
      setDrag(next);
    }

    function cleanup() {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleCancel);
      if (watchdog) clearTimeout(watchdog);
      if (unlockTimer) clearTimeout(unlockTimer);
    }

    function handleUp() {
      cleanup();
      if (dragging && dragRef.current) {
        commitDrop(dragRef.current.id, dragRef.current.overIndex);
      }
      reset();
      clearJustDraggedSoon();
    }

    function handleCancel() {
      cleanup();
      reset();
      clearJustDraggedSoon();
    }

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleCancel);
  }

  const isDragging = drag !== null;
  const others = isDragging ? categories.filter((c) => c.id !== drag.id) : categories;
  const dropIndex = isDragging
    ? Math.max(0, Math.min(drag.overIndex, others.length))
    : null;
  const draggedCategory = isDragging ? categories.find((c) => c.id === drag.id) : undefined;

  return (
    <div className="max-h-[70vh] overflow-y-auto pr-1">
      <div
        className="grid gap-3 justify-center"
        style={{ gridTemplateColumns: `repeat(auto-fill, ${TILE_WIDTH}px)` }}
      >
        {others.map((category, index) => (
          <div key={category.id} style={{ display: "contents" }}>
            {dropIndex === index && <DropSlot />}
            <div
              ref={(el) => {
                if (el) tileRefs.current.set(category.id, el);
                else tileRefs.current.delete(category.id);
              }}
              onPointerDown={(e) => editMode && handlePointerDown(e, category.id)}
              style={{
                position: "relative",
                cursor: editMode ? "grab" : "pointer",
                touchAction: "pan-y",
                WebkitTouchCallout: "none",
              }}
            >
              <Link
                href={`/objects/${category.id}`}
                draggable={false}
                onClick={(e) => {
                  if (justDraggedRef.current) {
                    e.preventDefault();
                    justDraggedRef.current = false;
                  }
                }}
                title={category.name}
                aria-label={category.name}
                className="flex flex-col items-center justify-center hover:shadow-sm transition-shadow"
                style={{
                  width: TILE_WIDTH,
                  height: TILE_HEIGHT,
                  borderRadius: 16,
                  border: `2px solid ${PINK_BORDER}`,
                  background: "#fff",
                  WebkitTouchCallout: "none",
                }}
              >
                <CategoryPreview category={category} />
              </Link>
              {editMode && (
                <button
                  type="button"
                  onClick={(e) => handleDelete(e, category)}
                  title={t.objectsBrowse.deleteCategoryButtonTitle}
                  aria-label={t.objectsBrowse.deleteCategoryAriaLabel(category.name)}
                  className="absolute top-1 left-1 w-6 h-6 flex items-center justify-center rounded-full bg-white text-gray-400 hover:text-red-600 shadow text-sm leading-none"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        ))}
        {dropIndex === others.length && <DropSlot />}

        <AddCategoryTile createCategory={createCategory} />
      </div>

      {isDragging && draggedCategory && (
        <div
          style={{
            position: "fixed",
            left: drag.x,
            top: drag.y,
            width: TILE_WIDTH,
            height: TILE_HEIGHT,
            transform: "translate(-50%, -50%) scale(1.05) rotate(-2deg)",
            pointerEvents: "none",
            zIndex: 50,
            borderRadius: 16,
            border: `2px solid ${PINK_BORDER}`,
            background: "#fff",
            boxShadow: "0 12px 24px rgba(0,0,0,0.18)",
            opacity: 0.95,
          }}
          className="flex flex-col items-center justify-center gap-2 p-2"
        >
          <CategoryPreview category={draggedCategory} />
        </div>
      )}
    </div>
  );
}

function DropSlot() {
  return (
    <div
      style={{
        width: TILE_WIDTH,
        height: TILE_HEIGHT,
        borderRadius: 16,
        border: `2px dashed ${PINK_BORDER}`,
        background: "var(--accent-soft)",
      }}
    />
  );
}

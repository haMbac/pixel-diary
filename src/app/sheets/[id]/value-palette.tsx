"use client";

import { Fragment, useState } from "react";
import type { Ref } from "react";
import { MAX_VALUES_PER_SHEET } from "@/lib/color";
import { useT } from "@/i18n/context";
import { useDragReorder } from "../../use-drag-reorder";
import { AddValueForm } from "./add-value-form";

export type ValueOption = { id: string; name: string; color: string };
type AddValueState = { error: string | null };

// Specialna "hodnota" na gumovanie - vybera sa v palete rovnako ako farba.
export const ERASER_ID = "__eraser__";

// Paleta farieb nad mriezkou (nahradza velku kartu "Legenda") - jeden riadok
// malych cipov, prilepeny hore pri scrollovani (globals.css .value-palette),
// aby sa dala farba prepnut kdekolvek v 31 riadkoch mriezky. Pri vela
// hodnotach sa cipy zalamuju do dalsich riadkov (vzdy su vidiet vsetky);
// prilepena hlavicka mesiacov si vysku palety meria (sheet-editor.tsx).
// Premenovanie/zmena farby/mazanie su v edit rezime (ValueManager), tu sa
// len vybera; "+" otvori formular na pridanie priamo vnutri palety (pod
// cipmi by sa pri prilepenej palete otvoril mimo obrazovky). V edit rezime
// sa cipy daju aj tahanim preusporiadat - rovnako ako dlazdice v menu
// sheetov.
export function ValuePalette({
  ref,
  values,
  selectedId,
  editMode,
  onSelect,
  onReorder,
  addValue,
}: {
  ref?: Ref<HTMLDivElement>;
  values: ValueOption[];
  selectedId: string | null;
  editMode: boolean;
  onSelect: (id: string) => void;
  onReorder: (orderedIds: string[]) => void;
  addValue: (prevState: AddValueState, formData: FormData) => Promise<AddValueState>;
}) {
  const t = useT();
  const [adding, setAdding] = useState(false);
  const atLimit = values.length >= MAX_VALUES_PER_SHEET;
  const formOpen = !atLimit && adding;

  const valuesById = new Map(values.map((v) => [v.id, v]));
  const { drag, others, dropIndex, itemRef, startDrag, consumeClickAfterDrag } = useDragReorder(
    values.map((v) => v.id),
    onReorder
  );
  const draggedValue = drag ? valuesById.get(drag.id) : undefined;

  return (
    <div ref={ref} className="value-palette">
      <div className="value-palette-row" role="group" aria-label={t.sheet.paletteLabel}>
        {editMode && (
          <button
            type="button"
            className="palette-chip"
            aria-pressed={selectedId === ERASER_ID}
            onClick={() => onSelect(ERASER_ID)}
            title={t.sheet.eraserSelectTitle}
          >
            <span className="palette-swatch palette-swatch--eraser" />
            <span className="palette-name">{t.sheet.eraserLabel}</span>
          </button>
        )}
        {others.map((id, index) => {
          const value = valuesById.get(id);
          if (!value) return null;
          return (
            <Fragment key={id}>
              {dropIndex === index && <DropSlot width={drag?.width} height={drag?.height} />}
              <button
                ref={itemRef(id)}
                type="button"
                className={`palette-chip${editMode ? " palette-chip--draggable" : ""}`}
                aria-pressed={selectedId === value.id}
                onPointerDown={(e) => editMode && startDrag(e, value.id)}
                onClick={() => {
                  if (consumeClickAfterDrag()) return;
                  onSelect(value.id);
                }}
                title={t.sheet.selectValueTitle(value.name)}
              >
                <span className="palette-swatch" style={{ backgroundColor: value.color }} />
                <span className="palette-name">{value.name}</span>
              </button>
            </Fragment>
          );
        })}
        {dropIndex === others.length && <DropSlot width={drag?.width} height={drag?.height} />}
        <button
          type="button"
          className="palette-chip palette-chip--add disabled:opacity-40"
          aria-expanded={formOpen}
          aria-label={atLimit ? t.sheet.valueLimitReached(MAX_VALUES_PER_SHEET) : t.sheet.addValueTitle}
          title={atLimit ? t.sheet.valueLimitReached(MAX_VALUES_PER_SHEET) : t.sheet.addValueTitle}
          disabled={atLimit}
          onClick={() => setAdding((open) => !open)}
        >
          +
        </button>
      </div>
      {/* Formular je uzky a vycentrovany - paleta ide cez celu sirku okna
          a pole na nazov by sa inak natiahlo od okraja po okraj. */}
      {formOpen && (
        <div className="pt-2 mx-auto w-full max-w-md">
          <AddValueForm action={addValue} onAdded={() => setAdding(false)} />
        </div>
      )}

      {/* "Duch" tahaneho cipu - plava s kurzorom, aby bolo jasne, co sa
          prave presuva. */}
      {drag && draggedValue && (
        <div
          className="palette-chip palette-chip--ghost"
          aria-hidden="true"
          style={{ left: drag.x, top: drag.y, width: drag.width, height: drag.height }}
        >
          <span className="palette-swatch" style={{ backgroundColor: draggedValue.color }} />
          <span className="palette-name">{draggedValue.name}</span>
        </div>
      )}
    </div>
  );
}

// Prazdny orámovaný slot - kam by tahany cip pristal, keby ho P teraz pustil.
function DropSlot({ width, height }: { width?: number; height?: number }) {
  return <span className="palette-drop-slot" style={{ width, height }} aria-hidden="true" />;
}

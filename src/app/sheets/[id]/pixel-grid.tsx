"use client";

import { useEffect, useOptimistic, useState, useTransition } from "react";
import { daysInMonth } from "@/lib/calendar";
import { AddValueForm } from "./add-value-form";
import { useEditMode } from "./edit-mode-context";

type ValueOption = { id: string; name: string; color: string };
type PixelData = { day: number; month: number; valueId: string | null };
type AddValueState = { error: string | null };

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "Máj", "Jún",
  "Júl", "Aug", "Sep", "Okt", "Nov", "Dec",
];

// Farba pre bunky, ktore v danom mesiaci neexistuju (napr. 30. februar) -
// zobrazime ich tmavo, aby mriezka ostala vizualne 31x12, len s
// vyraznene "vypnutymi" bunkami, nie prazdnym miestom.
const NONEXISTENT_DAY_COLOR = "#d1d5db"; // rovnaka ako farba ramu ostatnych pixelov

// Specialna "hodnota" na gumovanie - da sa vybrat v legende rovnako ako farba.
const ERASER_ID = "__eraser__";

export function SheetEditor({
  values,
  initialPixels,
  setPixel,
  deleteValue,
  addValue,
  year,
}: {
  values: ValueOption[];
  initialPixels: PixelData[];
  setPixel: (month: number, day: number, valueId: string | null) => Promise<void>;
  deleteValue: (valueId: string) => Promise<void>;
  addValue: (prevState: AddValueState, formData: FormData) => Promise<AddValueState>;
  year: number | null;
}) {
  // Ktora farba z legendy je prave "aktivna" (pouzije sa pri kliku do mriezky).
  // Default = prva hodnota v legende.
  const [selectedId, setSelectedId] = useState<string | null>(values[0]?.id ?? null);
  const editMode = useEditMode();

  // Guma je dostupna len v edit rezime - ked sa edit rezim vypne a
  // guma bola prave aktivna, prepneme vyber spat na prvu hodnotu (aby
  // nezostalo "vybrate nieco neviditelne").
  useEffect(() => {
    if (!editMode && selectedId === ERASER_ID) {
      setSelectedId(values[0]?.id ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editMode]);

  const [pixels, setOptimisticPixels] = useOptimistic(
    initialPixels,
    (state, updated: PixelData) => {
      const idx = state.findIndex(
        (p) => p.day === updated.day && p.month === updated.month
      );
      if (idx === -1) return [...state, updated];
      const copy = [...state];
      copy[idx] = updated;
      return copy;
    }
  );
  const [, startTransition] = useTransition();

  function getValueId(month: number, day: number): string | null {
    return pixels.find((p) => p.month === month && p.day === day)?.valueId ?? null;
  }

  function getColor(month: number, day: number): string | null {
    const valueId = getValueId(month, day);
    return values.find((v) => v.id === valueId)?.color ?? null;
  }

  function handleCellClick(month: number, day: number) {
    if (!selectedId) return;
    // Ziadne prepinanie/cyklovanie - klik vzdy nastavi presne to, co je
    // prave vybrane v legende (aj ked to je "guma").
    const nextValueId = selectedId === ERASER_ID ? null : selectedId;

    startTransition(async () => {
      setOptimisticPixels({ day, month, valueId: nextValueId });
      await setPixel(month, day, nextValueId);
    });
  }

  function handleDelete(valueId: string) {
    startTransition(async () => {
      await deleteValue(valueId);
    });
    if (selectedId === valueId) {
      setSelectedId(values.find((v) => v.id !== valueId)?.id ?? null);
    }
  }

  return (
    <div>
      <h2 className="text-lg font-medium mb-3">Legenda (hodnoty)</h2>
      {values.length === 0 ? (
        <p className="text-gray-500 mb-3">Zatiaľ žiadne hodnoty.</p>
      ) : (
        <ul className="list-none space-y-2 mb-3">
          {editMode && (
            <li className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSelectedId(ERASER_ID)}
                title="Vybrať gumu"
                style={{
                  display: "inline-block",
                  width: 24,
                  height: 24,
                  borderRadius: 4,
                  border:
                    selectedId === ERASER_ID
                      ? "2px solid #111827"
                      : "1px solid #d1d5db",
                  backgroundColor: "#ffffff",
                  backgroundImage:
                    "linear-gradient(to bottom right, transparent 45%, #ef4444 45%, #ef4444 55%, transparent 55%)",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              />
              <span className="flex-1 text-gray-500">
                Guma
                {selectedId === ERASER_ID && (
                  <span className="text-xs text-gray-400 ml-2">(aktívna)</span>
                )}
              </span>
            </li>
          )}
          {values.map((value) => (
            <li key={value.id} className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSelectedId(value.id)}
                title={`Vybrať „${value.name}" ako aktívnu farbu`}
                style={{
                  display: "inline-block",
                  width: 24,
                  height: 24,
                  borderRadius: 4,
                  border:
                    selectedId === value.id
                      ? "2px solid #111827"
                      : "1px solid #d1d5db",
                  backgroundColor: value.color,
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              />
              <span className="flex-1">
                {value.name}
                {selectedId === value.id && (
                  <span className="text-xs text-gray-400 ml-2">(aktívna)</span>
                )}
              </span>
              <button
                type="button"
                onClick={() => handleDelete(value.id)}
                className="text-gray-400 hover:text-red-600 text-sm"
                title="Zmazať"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <AddValueForm action={addValue} />

      <h2 className="text-lg font-medium mt-8 mb-3">Mriežka</h2>
      {values.length > 0 && !selectedId && (
        <p className="text-sm text-amber-600 mb-3">
          Klikni na farbu v legende, ktorou chceš maľovať.
        </p>
      )}
      <div
        style={{
          display: "inline-grid",
          gridTemplateColumns: `2rem repeat(12, 1.75rem)`,
          gap: "2px",
        }}
      >
        <div />
        {MONTH_NAMES.map((name) => (
          <div key={name} className="text-xs text-gray-500 text-center">
            {name}
          </div>
        ))}

        {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
          <div key={day} style={{ display: "contents" }}>
            <div className="text-xs text-gray-500 flex items-center justify-end pr-1">
              {day}
            </div>
            {Array.from({ length: 12 }, (_, monthIndex) => {
              const month = monthIndex + 1;
              const cellStyle = {
                width: "1.75rem",
                height: "1.75rem",
                borderRadius: 3,
              };

              // Tento den v danom mesiaci neexistuje (napr. 30. februar,
              // alebo 29. februar v nepriestupnom roku) - zobrazime tmavu,
              // neklikatelnu bunku (nie prazdne miesto).
              if (day > daysInMonth(year, month)) {
                return (
                  <div
                    key={month}
                    style={{
                      ...cellStyle,
                      backgroundColor: NONEXISTENT_DAY_COLOR,
                      border: "none",
                    }}
                  />
                );
              }

              const color = getColor(month, day);
              return (
                <button
                  key={month}
                  type="button"
                  onClick={() => handleCellClick(month, day)}
                  title={`${day}. ${MONTH_NAMES[monthIndex]}`}
                  style={{
                    ...cellStyle,
                    border: "1px solid #d1d5db",
                    backgroundColor: color ?? "#f9fafb",
                    cursor: selectedId ? "pointer" : "not-allowed",
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

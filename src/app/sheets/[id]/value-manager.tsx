"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useT } from "@/i18n/context";
import type { ValueOption } from "./value-palette";

type UpdateValueColorAction = (valueId: string, color: string) => Promise<{ error: string | null }>;
type UpdateValueNameAction = (valueId: string, name: string) => Promise<{ error: string | null }>;

// Bod 3.21/3.22: sprava hodnot - len v edit rezime (✎), pod paletou. Vyber
// farby na malovanie je vzdy v palete; tu sa hodnoty len premenuvaju,
// prefarbuju a mazu.
export function ValueManager({
  values,
  usedValueIds,
  onDelete,
  updateValueColor,
  updateValueName,
}: {
  values: ValueOption[];
  usedValueIds: Set<string>;
  onDelete: (valueId: string, replacementValueId?: string | null) => void;
  updateValueColor: UpdateValueColorAction;
  updateValueName: UpdateValueNameAction;
}) {
  const t = useT();
  if (values.length === 0) return null;

  return (
    <section className="mb-4">
      <h3 className="mb-1">{t.sheet.valuesHeading}</h3>
      {values.length > 1 && (
        <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>
          {t.sheet.reorderValuesHint}
        </p>
      )}
      <ul
        className="list-none space-y-2 p-3"
        style={{ border: "2px solid var(--border)", borderRadius: 12, backgroundColor: "var(--card-fill)" }}
      >
        {values.map((value) => (
          <ValueRow
            key={value.id}
            value={value}
            otherValues={values.filter((v) => v.id !== value.id)}
            isUsed={usedValueIds.has(value.id)}
            onDelete={(replacementValueId) => onDelete(value.id, replacementValueId)}
            updateValueColor={updateValueColor}
            updateValueName={updateValueName}
          />
        ))}
      </ul>
    </section>
  );
}

// Farba a nazov su zamerne DVA samostatne prvky (nie jeden vnoreny do
// druheho) - <input> vnoreny v <button> je neplatne HTML a spravanie naprieč
// prehliadačmi je nespoľahlivé.
function ValueRow({
  value,
  otherValues,
  isUsed,
  onDelete,
  updateValueColor,
  updateValueName,
}: {
  value: ValueOption;
  otherValues: ValueOption[];
  isUsed: boolean;
  onDelete: (replacementValueId?: string | null) => void;
  updateValueColor: UpdateValueColorAction;
  updateValueName: UpdateValueNameAction;
}) {
  const t = useT();
  const [color, setColor] = useState(value.color);
  const [colorError, setColorError] = useState<string | null>(null);
  const [, startColorTransition] = useTransition();
  const previousColorRef = useRef(value.color);

  const [name, setName] = useState(value.name);
  const [nameError, setNameError] = useState<string | null>(null);
  const [, startNameTransition] = useTransition();
  const previousNameRef = useRef(value.name);

  // Bod 3.22: "pokial je hodnota vyuzita, system sa spyta ci ju nahradit
  // inou hodnotou" - kym sa P nerozhodne, riadok zobrazuje tento vyber
  // namiesto priameho vymazania.
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [replacementId, setReplacementId] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setColor(value.color);
    previousColorRef.current = value.color;
  }, [value.color]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setName(value.name);
    previousNameRef.current = value.name;
  }, [value.name]);

  function handleColorChange(next: string) {
    const previous = previousColorRef.current;
    setColor(next);
    setColorError(null);
    startColorTransition(async () => {
      const result = await updateValueColor(value.id, next);
      if (result.error) {
        setColor(previous);
        setColorError(result.error);
      } else {
        previousColorRef.current = next;
      }
    });
  }

  function commitName() {
    const trimmed = name.trim();
    const previous = previousNameRef.current;
    if (trimmed === previous) {
      setName(previous);
      return;
    }
    setNameError(null);
    startNameTransition(async () => {
      const result = await updateValueName(value.id, trimmed);
      if (result.error) {
        setName(previous);
        setNameError(result.error);
      } else {
        previousNameRef.current = trimmed;
        setName(trimmed);
      }
    });
  }

  function handleDeleteClick() {
    if (!isUsed) {
      onDelete();
      return;
    }
    setConfirmingDelete(true);
  }

  return (
    <li>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={color}
          onChange={(e) => handleColorChange(e.target.value)}
          title={t.sheet.changeColorTitle}
          style={{
            width: 32,
            height: 32,
            borderRadius: 4,
            border: "1px solid #d1d5db",
            flexShrink: 0,
            padding: 0,
          }}
        />
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={commitName}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          className="flex-1 min-w-0 py-1 px-1 border-b bg-transparent focus:outline-none"
          style={{ borderColor: "var(--border)" }}
        />
        <button
          type="button"
          onClick={handleDeleteClick}
          className="text-gray-400 hover:text-red-600 text-sm p-2"
          title={t.sheet.deleteTitle}
        >
          ✕
        </button>
      </div>
      {colorError && <p className="text-red-600 text-xs mt-1">{colorError}</p>}
      {nameError && <p className="text-red-600 text-xs mt-1">{nameError}</p>}
      {confirmingDelete && (
        <div
          className="mt-2 p-2 text-sm"
          style={{ border: `1px solid var(--border)`, borderRadius: 8, backgroundColor: "var(--paper)" }}
        >
          <p className="mb-2">{t.sheet.valueInUseConfirm(value.name)}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={replacementId}
              onChange={(e) => setReplacementId(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
              style={{ borderColor: "var(--border)" }}
            >
              <option value="">{t.sheet.noReplacementOption}</option>
              {otherValues.map((v) => (
                <option key={v.id} value={v.id}>
                  {t.sheet.replaceWithOption(v.name)}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                setConfirmingDelete(false);
                setReplacementId("");
              }}
              className="text-sm px-2 py-1 rounded border"
              style={{ borderColor: "var(--border)" }}
            >
              {t.sheet.cancelButton}
            </button>
            <button
              type="button"
              onClick={() => {
                onDelete(replacementId || null);
                setConfirmingDelete(false);
                setReplacementId("");
              }}
              className="text-sm px-2 py-1 rounded bg-red-600 text-white"
            >
              {t.sheet.confirmDeleteButton}
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

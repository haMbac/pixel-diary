"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useT } from "@/i18n/context";
import type { AttributeSchema } from "@/lib/objects";
import { IconPicker } from "../../icon-picker";

type State = { error: string | null };

export type ObjectFormValues = {
  name: string;
  icon: string | null;
  attributes: Record<string, string>; // templateId -> hodnota
};

const EMPTY_VALUES: ObjectFormValues = { name: "", icon: null, attributes: {} };

// Bod 4.21/4.22: formular objektu, generovany dynamicky podla aktualnej
// sablony kategorie (jeden vstup na kazdy atribut). Pouziva sa pre
// vytvorenie AJ upravenie - pri uprave sa poskytne "objektId" a
// "initialValues" (predvyplnene z existujucich hodnot). Rovnaky vzor ako
// AddValueForm (kontrolovane polia + "wasPending" ref).
export function ObjectForm({
  template,
  categoryIcon,
  action,
  objektId,
  initialValues,
  submitLabel,
  pendingLabel,
  onSuccess,
}: {
  template: AttributeSchema[];
  // Ikona kategorie - ked objekt nema vlastnu ("icon" je null), nahlad v
  // IconPicker ukazuje TOTO (co sa aj realne zobrazi v zozname objektov).
  categoryIcon: string | null;
  action: (prevState: State, formData: FormData) => Promise<State>;
  objektId?: string;
  initialValues?: ObjectFormValues;
  submitLabel: string;
  pendingLabel: string;
  // Na rozdiel od AddValueForm/createSheet tato akcia po uspechu
  // NEredirectuje (ostavame na tej istej stranke kategorie) - modálne okno,
  // v ktorom formular zvycajne zije, sa preto musi zavriet samo cez tento
  // callback namiesto spoliehania sa na navigaciu.
  onSuccess?: () => void;
}) {
  const t = useT();
  const [state, formAction, isPending] = useActionState(action, { error: null });

  const [name, setName] = useState(initialValues?.name ?? EMPTY_VALUES.name);
  const [icon, setIcon] = useState(initialValues?.icon ?? EMPTY_VALUES.icon);
  const [values, setValues] = useState<Record<string, string>>(
    initialValues?.attributes ?? EMPTY_VALUES.attributes
  );

  const wasPending = useRef(false);
  useEffect(() => {
    if (wasPending.current && !isPending && !state.error) {
      setName(initialValues?.name ?? EMPTY_VALUES.name);
      setIcon(initialValues?.icon ?? EMPTY_VALUES.icon);
      setValues(initialValues?.attributes ?? EMPTY_VALUES.attributes);
      onSuccess?.();
    }
    wasPending.current = isPending;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPending, state.error]);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {objektId && <input type="hidden" name="objektId" value={objektId} />}
      <input type="hidden" name="icon" value={icon ?? ""} />

      <div className="flex items-center gap-3">
        <IconPicker
          value={icon ?? categoryIcon}
          onChange={setIcon}
          allowClear
          size={48}
          label={t.object.changeObjectIconLabel}
        />
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {icon ? t.object.ownIconLabel : t.object.inheritedCategoryIconLabel}
        </span>
      </div>

      <label className="text-sm text-gray-600">
        {t.object.nameLabel}
        <input
          type="text"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1 w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]"
        />
      </label>

      {template.map((attr) => (
        <div key={attr.id}>
          <label className="text-sm text-gray-600 block mb-1">{attr.name}</label>
          {attr.type === "RATING" ? (
            attr.ratingDisplay === "number" ? (
              <input
                type="number"
                name={`attr_${attr.id}`}
                min={1}
                max={attr.ratingScale ?? 5}
                value={values[attr.id] ?? ""}
                onChange={(e) =>
                  setValues((v) => ({ ...v, [attr.id]: e.target.value }))
                }
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]"
              />
            ) : (
              <StarPicker
                scale={attr.ratingScale ?? 5}
                value={Number(values[attr.id]) || 0}
                onChange={(n) => setValues((v) => ({ ...v, [attr.id]: String(n) }))}
                name={`attr_${attr.id}`}
              />
            )
          ) : (
            <input
              type={attr.type === "NUMBER" ? "number" : "text"}
              name={`attr_${attr.id}`}
              value={values[attr.id] ?? ""}
              onChange={(e) =>
                setValues((v) => ({ ...v, [attr.id]: e.target.value }))
              }
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]"
            />
          )}
        </div>
      ))}

      {state.error && <p className="text-red-600 text-sm">{state.error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="bg-black text-white rounded px-4 py-2 text-sm disabled:opacity-50 mt-2"
      >
        {isPending ? pendingLabel : submitLabel}
      </button>
    </form>
  );
}

// Klikatelny rad hviezd velkosti "scale" (bod: rating format - P si zvoli
// 5 alebo 10 pri vytvarani atributu). Klik na uz vybratu hviezdu hodnotenie
// zrusi (spat na 0/nevyplnene). Skutocna hodnota ide cez skryty input, aby
// sa dala odoslat obycajnym <form action>.
function StarPicker({
  scale,
  value,
  onChange,
  name,
}: {
  scale: number;
  value: number;
  onChange: (n: number) => void;
  name: string;
}) {
  const t = useT();
  return (
    <div className="flex items-center gap-1 flex-wrap">
      <input type="hidden" name={name} value={value} />
      {Array.from({ length: scale }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n === value ? 0 : n)}
          className="text-xl leading-none"
          style={{ color: n <= value ? "var(--accent)" : "#d1d5db" }}
          aria-label={t.object.starRatingLabel(n, scale)}
          title={t.object.starRatingLabel(n, scale)}
        >
          ★
        </button>
      ))}
    </div>
  );
}

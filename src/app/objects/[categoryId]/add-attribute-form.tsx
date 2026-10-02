"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useT } from "@/i18n/context";
import type { AttributeValueType, RatingDisplay } from "@/lib/objects";

type State = { error: string | null };

const DEFAULT_TYPE: AttributeValueType = "TEXT";
const DEFAULT_SCALE = 5;
const DEFAULT_DISPLAY: RatingDisplay = "stars";

// Bod 4.31: pridanie noveho atributu do sablony kategorie. Rovnaky vzor ako
// AddValueForm (kontrolovane polia + "wasPending" ref, aby validacna chyba
// na serveri nevymazala rozrobeny formular).
export function AddAttributeForm({
  action,
}: {
  action: (prevState: State, formData: FormData) => Promise<State>;
}) {
  const t = useT();
  const [state, formAction, isPending] = useActionState(action, {
    error: null,
  });

  const [name, setName] = useState("");
  const [type, setType] = useState<AttributeValueType>(DEFAULT_TYPE);
  const [ratingScale, setRatingScale] = useState(DEFAULT_SCALE);
  const [ratingDisplay, setRatingDisplay] = useState<RatingDisplay>(DEFAULT_DISPLAY);
  // Predvolene zaskrtnute len pre Hodnotenie (rovnake pravidlo ako
  // isFeatured() v src/lib/objects.ts pre chybajuce/stare atributy) - ale
  // len ked to P sam neprepol, preto samostatny "touched" flag.
  const [featuredTouched, setFeaturedTouched] = useState(false);
  const [featured, setFeatured] = useState(type === "RATING");

  const wasPending = useRef(false);
  useEffect(() => {
    if (wasPending.current && !isPending && !state.error) {
      setName("");
      setType(DEFAULT_TYPE);
      setRatingScale(DEFAULT_SCALE);
      setRatingDisplay(DEFAULT_DISPLAY);
      setFeaturedTouched(false);
      setFeatured(DEFAULT_TYPE === "RATING");
    }
    wasPending.current = isPending;
  }, [isPending, state.error]);

  function handleTypeChange(next: AttributeValueType) {
    setType(next);
    if (!featuredTouched) setFeatured(next === "RATING");
  }

  return (
    <form action={formAction}>
      <div className="flex flex-wrap gap-2 items-center">
        <select
          name="type"
          value={type}
          onChange={(e) => handleTypeChange(e.target.value as AttributeValueType)}
          className="border rounded px-2 py-2 text-sm"
          style={{ borderColor: "var(--border)" }}
        >
          <option value="TEXT">{t.object.attributeTypeTextOption}</option>
          <option value="NUMBER">{t.object.attributeTypeNumberOption}</option>
          <option value="RATING">{t.object.attributeTypeRatingOption}</option>
        </select>
        {type === "RATING" && (
          <>
            <select
              name="ratingScale"
              value={ratingScale}
              onChange={(e) => setRatingScale(Number(e.target.value))}
              className="border rounded px-2 py-2 text-sm"
              style={{ borderColor: "var(--border)" }}
            >
              <option value={5}>{t.object.ratingScaleOf5Option}</option>
              <option value={10}>{t.object.ratingScaleOf10Option}</option>
            </select>
            <select
              name="ratingDisplay"
              value={ratingDisplay}
              onChange={(e) => setRatingDisplay(e.target.value as RatingDisplay)}
              className="border rounded px-2 py-2 text-sm"
              style={{ borderColor: "var(--border)" }}
            >
              <option value="stars">{t.object.ratingDisplayStarsOption}</option>
              <option value="number">{t.object.ratingDisplayNumberOption}</option>
            </select>
          </>
        )}
        <input
          type="text"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t.object.attributeNamePlaceholder}
          required
          className="flex-1 min-w-[8rem] border rounded px-3 py-2"
          style={{ borderColor: "var(--border)" }}
        />
        <button
          type="submit"
          disabled={isPending}
          className="bg-black text-white rounded px-4 py-2 disabled:opacity-50"
        >
          {isPending ? t.object.addingEllipsis : t.object.addButton}
        </button>
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-600 mt-2">
        <input
          type="checkbox"
          name="featured"
          checked={featured}
          onChange={(e) => {
            setFeaturedTouched(true);
            setFeatured(e.target.checked);
          }}
        />
        {t.object.showOnTileCheckboxLabel}
      </label>
      {state.error && <p className="text-red-600 text-sm mt-2">{state.error}</p>}
    </form>
  );
}

"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useT } from "@/i18n/context";

type State = { error: string | null };

const DEFAULT_COLOR = "#4ade80";

// "use client" hore = tento subor bezi aj v prehliadaci (nie len na
// serveri). Potrebujeme to, lebo useActionState musi po odoslani
// formulara vediet ZOBRAZIT vysledok (chybu) priamo v UI bez
// prekreslenia celej stranky.
export function AddValueForm({
  action,
  onAdded,
}: {
  action: (prevState: State, formData: FormData) => Promise<State>;
  onAdded?: () => void;
}) {
  const t = useT();
  const [state, formAction, isPending] = useActionState(action, {
    error: null,
  });

  // Polia su zamerne CONTROLLED (value + onChange) - React po kazdom
  // dokonceni Action inak automaticky vynuluje nekontrolovane polia
  // formulara, aj ked Action vrati chybu. Tym by sa pri chybnej validacii
  // (napr. prilis podobna farba) zmazal aj nazov aj vybrata farba a P by
  // musel oboje zadavat znova.
  const [name, setName] = useState("");
  const [color, setColor] = useState(DEFAULT_COLOR);

  // Polia vycistime len po SKUTOCNOM uspesnom pridani - t.j. ked "isPending"
  // prave prebehlo z true na false BEZ chyby. Pri chybe (state.error) ich
  // schvalne necha ako su, aby P nemusel znova pisat nazov a vyberat farbu.
  const wasPending = useRef(false);
  useEffect(() => {
    if (wasPending.current && !isPending && !state.error) {
      setName("");
      setColor(DEFAULT_COLOR);
      onAdded?.();
    }
    wasPending.current = isPending;
  }, [isPending, state.error, onAdded]);

  return (
    <form action={formAction}>
      <div className="flex gap-2 items-center">
        <input
          type="color"
          name="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="h-10 w-12 shrink-0 border rounded"
          style={{ borderColor: "var(--border)" }}
        />
        <input
          type="text"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t.sheet.namePlaceholder}
          required
          className="flex-1 border rounded px-3 py-2"
          style={{ borderColor: "var(--border)" }}
        />
        <button
          type="submit"
          disabled={isPending}
          className="bg-black text-white rounded px-4 py-2 disabled:opacity-50"
        >
          {isPending ? t.sheet.addingButton : t.sheet.addButton}
        </button>
      </div>
      {state.error && (
        <p className="text-red-600 text-sm mt-2">{state.error}</p>
      )}
    </form>
  );
}

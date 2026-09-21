"use client";

import { useActionState } from "react";

type State = { error: string | null };

// "use client" hore = tento subor bezi aj v prehliadaci (nie len na
// serveri). Potrebujeme to, lebo useActionState musi po odoslani
// formulara vediet ZOBRAZIT vysledok (chybu) priamo v UI bez
// prekreslenia celej stranky.
export function AddValueForm({
  action,
}: {
  action: (prevState: State, formData: FormData) => Promise<State>;
}) {
  const [state, formAction, isPending] = useActionState(action, {
    error: null,
  });

  return (
    <form action={formAction}>
      <div className="flex gap-2 items-center">
        <input
          type="color"
          name="color"
          defaultValue="#4ade80"
          className="h-10 w-12 border rounded"
        />
        <input
          type="text"
          name="name"
          placeholder="Názov (napr. Cvičenie)"
          required
          className="flex-1 border rounded px-3 py-2"
        />
        <button
          type="submit"
          disabled={isPending}
          className="bg-black text-white rounded px-4 py-2 disabled:opacity-50"
        >
          {isPending ? "Pridávam…" : "Pridať"}
        </button>
      </div>
      {state.error && (
        <p className="text-red-600 text-sm mt-2">{state.error}</p>
      )}
    </form>
  );
}

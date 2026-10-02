"use client";

import { useState, useTransition } from "react";
import type { DailyEntrySheet } from "@/lib/sheets";
import type { DailyEntryPick } from "./sheet-actions";
import { useT } from "@/i18n/context";

const PINK_BORDER = "var(--border)";

// Bod 5 funkcnej specifikacie ("Denný zápis") - tlačidlo "Dnes" na hlavnej
// stránke otvorí sprievodcu, ktorý postupne prejde všetky sheety s aspoň
// jednou hodnotou (pozri getSheetsForDailyEntry) a P si pre každý vyberie
// hodnotu reprezentujúcu dnešok. Kliknutie na hodnotu rovno posunie na
// ďalší sheet (žiadne samostatné "next" tlačidlo, presne podľa
// špecifikácie), "Späť"/"Preskočiť" menia krok. Uloženie prebehne AŽ NARAZ
// na poslednom "zhrnutie" kroku stlačením "Hotovo" - dovtedy je všetko len
// v lokálnom stave, takže zatvorenie okna uprostred sprievodcu nič
// nezapíše.
export function DailyEntry({
  sheets,
  submitDailyEntry,
}: {
  sheets: DailyEntrySheet[];
  submitDailyEntry: (picks: DailyEntryPick[]) => Promise<void>;
}) {
  const t = useT();

  // Hodnoty uz zapisane pre dnesok (z predchadzajuceho vyplnenia) - ked su
  // nejake, otvorenie sprievodcu ide rovno na zhrnutie a oznami, ze dnesny
  // zaznam uz existuje, namiesto toho aby sa tvarilo, ze je prazdny.
  const todaysPicks = Object.fromEntries(
    sheets.filter((s) => s.todayValueId).map((s) => [s.id, s.todayValueId as string])
  );
  const alreadyDone = Object.keys(todaysPicks).length > 0;

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  const totalSteps = sheets.length;
  const onSummary = step >= totalSteps;
  const currentSheet = onSummary ? null : sheets[step];

  function openWizard() {
    if (alreadyDone) {
      setPicks(todaysPicks);
      setStep(totalSteps);
    } else {
      setPicks({});
      setStep(0);
    }
    setOpen(true);
  }

  function close() {
    setOpen(false);
    setStep(0);
    setPicks({});
  }

  function pick(sheetId: string, valueId: string) {
    setPicks((p) => ({ ...p, [sheetId]: valueId }));
    setStep((s) => s + 1);
  }

  // Posun na dalsi krok BEZ zmeny vyberu - bod: "ked sa P vrati na krok,
  // ktory uz ma vybratu hodnotu, a nevyberie nic ine, ma si tu hodnotu
  // zachovat" (predtym jedine tlacidlo vpred bolo "Preskočiť", ktore vyber
  // vzdy zmazalo - aj ked uz nejaky bol). Nazov "advance" (nie "next") -
  // "next" uz nizsie tienuje lokalna premenna vo vnutri skip().
  function advance() {
    setStep((s) => s + 1);
  }

  // Preskočenie = žiadny zápis (nezmení existujúcu hodnotu pre dnešok) -
  // preto aj prípadný predošlý výber pre tento sheet (keby sa sem P vrátil
  // cez "Späť" a tentokrát sa rozhodol preskočiť) zrušíme.
  function skip(sheetId: string) {
    setPicks((p) => {
      if (!(sheetId in p)) return p;
      const next = { ...p };
      delete next[sheetId];
      return next;
    });
    setStep((s) => s + 1);
  }

  function done() {
    const entries: DailyEntryPick[] = Object.entries(picks).map(([sheetId, valueId]) => ({
      sheetId,
      valueId,
    }));
    startTransition(async () => {
      await submitDailyEntry(entries);
      close();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={openWizard}
        disabled={sheets.length === 0}
        title={
          sheets.length === 0
            ? t.dailyEntry.noValuesTitle
            : alreadyDone
              ? t.dailyEntry.alreadyDoneTitle
              : t.dailyEntry.fillTitle
        }
        className="bg-black text-white rounded-full px-6 py-2 text-sm disabled:opacity-40"
      >
        {t.dailyEntry.openButton}
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-30"
          onClick={close}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ border: `2px solid ${PINK_BORDER}`, borderRadius: 20 }}
            className="bg-white p-6 max-w-sm w-full max-h-[85vh] overflow-y-auto flex flex-col"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-400">
                {onSummary ? t.dailyEntry.summaryLabel : t.dailyEntry.stepLabel(step + 1, totalSteps)}
              </span>
              <button
                type="button"
                onClick={close}
                aria-label={t.dailyEntry.closeLabel}
                title={t.dailyEntry.closeLabel}
                className="text-gray-400 hover:text-gray-600 text-sm"
              >
                ✕
              </button>
            </div>

            {currentSheet && (
              <>
                <h2 className="text-lg font-medium mb-4">{currentSheet.name}</h2>
                <ul className="list-none space-y-2 mb-4">
                  {currentSheet.values.map((value) => {
                    const active = picks[currentSheet.id] === value.id;
                    return (
                      <li key={value.id}>
                        <button
                          type="button"
                          onClick={() => pick(currentSheet.id, value.id)}
                          className="flex items-center gap-3 w-full py-2 px-2 text-left rounded"
                          style={{
                            border: active ? "2px solid #111827" : "1px solid #d1d5db",
                          }}
                        >
                          <span
                            style={{
                              display: "inline-block",
                              width: 28,
                              height: 28,
                              borderRadius: 4,
                              backgroundColor: value.color,
                              flexShrink: 0,
                            }}
                          />
                          <span className="flex-1">{value.name}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <div className="flex items-center justify-between mt-auto pt-2">
                  <button
                    type="button"
                    onClick={() => setStep((s) => Math.max(0, s - 1))}
                    disabled={step === 0}
                    className="text-sm text-gray-500 disabled:opacity-30"
                  >
                    {t.dailyEntry.backButton}
                  </button>
                  {currentSheet.id in picks ? (
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => skip(currentSheet.id)}
                        className="text-xs text-gray-400 hover:text-gray-600 underline"
                      >
                        {t.dailyEntry.cancelSelectionButton}
                      </button>
                      <button
                        type="button"
                        onClick={advance}
                        className="text-sm font-medium text-gray-700 hover:text-black"
                      >
                        {t.dailyEntry.nextButton}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => skip(currentSheet.id)}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      {t.dailyEntry.skipButton}
                    </button>
                  )}
                </div>
              </>
            )}

            {onSummary && (
              <>
                <h2 className="text-lg font-medium mb-1">
                  {alreadyDone ? t.dailyEntry.alreadyDoneHeading : t.dailyEntry.summaryHeading}
                </h2>
                {alreadyDone && (
                  <p className="text-sm text-gray-500 mb-3">
                    {t.dailyEntry.changeHint}
                  </p>
                )}
                <ul className="list-none space-y-2 mb-4">
                  {sheets.map((sheet, index) => {
                    const valueId = picks[sheet.id];
                    const value = sheet.values.find((v) => v.id === valueId);
                    return (
                      <li key={sheet.id}>
                        <button
                          type="button"
                          onClick={() => setStep(index)}
                          className="flex items-center gap-3 w-full py-2 px-2 text-left rounded hover:bg-gray-50"
                        >
                          <span className="flex-1">{sheet.name}</span>
                          {value ? (
                            <span className="flex items-center gap-2 text-sm text-gray-600">
                              <span
                                style={{
                                  display: "inline-block",
                                  width: 16,
                                  height: 16,
                                  borderRadius: 3,
                                  backgroundColor: value.color,
                                }}
                              />
                              {value.name}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400 italic">{t.dailyEntry.skippedLabel}</span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <div className="flex items-center justify-between mt-auto pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(Math.max(0, totalSteps - 1))}
                    className="text-sm text-gray-500"
                  >
                    {t.dailyEntry.backButton}
                  </button>
                  <button
                    type="button"
                    onClick={done}
                    disabled={pending}
                    className="bg-black text-white rounded px-4 py-2 text-sm disabled:opacity-50"
                  >
                    {pending ? t.dailyEntry.savingLabel : t.dailyEntry.doneButton}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

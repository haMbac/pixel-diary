"use client";

import { useRouter } from "next/navigation";
import { useActionState, useCallback, useMemo, useOptimistic, useRef, useState, useTransition } from "react";
import type { ReactNode } from "react";
import { effectiveYear } from "@/lib/calendar";
import { readSheetViewCookie, writeSheetViewCookie, type SheetView } from "@/lib/sheet-view";
import { useT } from "@/i18n/context";
import { useEditMode } from "../../edit-mode-context";
import { ViewAutoIcon, ViewCalendarIcon, ViewColumnsIcon, ViewRowsIcon } from "../../ui-icons";
import { ERASER_ID, ValuePalette, type ValueOption } from "./value-palette";
import { ValueManager } from "./value-manager";
import { YearGrid } from "./year-grid";
import { CalendarGrid } from "./calendar-grid";

type PixelData = { day: number; month: number; valueId: string | null };
type ActionState = { error: string | null };
type RenameSheetAction = (prevState: ActionState, formData: FormData) => Promise<ActionState>;
type DeleteSheetAction = (sheetId: string) => Promise<void>;

function cellKey(month: number, day: number): string {
  return `${month}-${day}`;
}

// Najdlhsia pauza medzi dvoma klikmi, ktore sa este beru ako dvojklik.
const DOUBLE_CLICK_MS = 450;

export function SheetEditor({
  sheetId,
  sheetName,
  renameSheet,
  deleteSheet,
  values,
  initialPixels,
  setPixel,
  deleteValue,
  addValue,
  updateValueColor,
  updateValueName,
  reorderValues,
  year,
  initialView,
}: {
  sheetId: string;
  sheetName: string;
  renameSheet: RenameSheetAction;
  deleteSheet: DeleteSheetAction;
  values: ValueOption[];
  initialPixels: PixelData[];
  setPixel: (month: number, day: number, valueId: string | null) => Promise<void>;
  deleteValue: (valueId: string, replacementValueId?: string | null) => Promise<void>;
  addValue: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  updateValueColor: (valueId: string, color: string) => Promise<{ error: string | null }>;
  updateValueName: (valueId: string, name: string) => Promise<{ error: string | null }>;
  reorderValues: (orderedIds: string[]) => Promise<void>;
  year: number | null;
  initialView: SheetView;
}) {
  const t = useT();
  const editMode = useEditMode();
  const monthNames = [
    t.sheet.monthJan, t.sheet.monthFeb, t.sheet.monthMar, t.sheet.monthApr,
    t.sheet.monthMay, t.sheet.monthJun, t.sheet.monthJul, t.sheet.monthAug,
    t.sheet.monthSep, t.sheet.monthOct, t.sheet.monthNov, t.sheet.monthDec,
  ];
  const weekdayNames = [
    t.sheet.weekdayMon, t.sheet.weekdayTue, t.sheet.weekdayWed, t.sheet.weekdayThu,
    t.sheet.weekdayFri, t.sheet.weekdaySat, t.sheet.weekdaySun,
  ];

  // Aktivna farba = posledna vybrana, pokial este existuje, inak prva v
  // palete - odvodene pri kazdom vykresleni (nie ulozene), takze prva
  // hodnota pridana do prazdneho sheetu je hned vybrata a po vymazani
  // vybranej hodnoty sa vyber sam presunie na prvu. Guma je len v edit
  // rezime - po jeho vypnuti sa vyber z gumy vrati na prvu hodnotu.
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [prevEditMode, setPrevEditMode] = useState(editMode);
  if (prevEditMode !== editMode) {
    setPrevEditMode(editMode);
    if (!editMode && pickedId === ERASER_ID) setPickedId(null);
  }

  // Nove poradie hodnot (tahanie v palete) sa ukaze hned, este kym ho
  // server ulozi - rovnako ako optimisticke malovanie pixelov nizsie.
  const [orderedValues, setOptimisticOrder] = useOptimistic(values, (_, next: ValueOption[]) => next);
  const [, startReorderTransition] = useTransition();
  function handleReorder(orderedIds: string[]) {
    const byId = new Map(orderedValues.map((v) => [v.id, v]));
    const next = orderedIds.map((id) => byId.get(id)).filter((v): v is ValueOption => v != null);
    startReorderTransition(async () => {
      setOptimisticOrder(next);
      await reorderValues(orderedIds);
    });
  }

  const firstValueId = orderedValues[0]?.id ?? null;
  const selectedId =
    pickedId === ERASER_ID
      ? editMode
        ? ERASER_ID
        : firstValueId
      : pickedId != null && orderedValues.some((v) => v.id === pickedId)
        ? pickedId
        : firstValueId;

  // Cookie (nie len serverom poslane initialView) - pri navrate spat v
  // historii Next.js pouzije ulozenu, uz neaktualnu verziu stranky.
  const [view, setView] = useState<SheetView>(() => readSheetViewCookie() ?? initialView);
  function changeView(next: SheetView) {
    setView(next);
    writeSheetViewCookie(next);
  }

  const [pixels, setOptimisticPixels] = useOptimistic(initialPixels, (state, updated: PixelData) => {
    const idx = state.findIndex((p) => p.day === updated.day && p.month === updated.month);
    if (idx === -1) return [...state, updated];
    const copy = [...state];
    copy[idx] = updated;
    return copy;
  });
  const [, startTransition] = useTransition();

  const valueIdByCell = useMemo(
    () => new Map(pixels.map((p) => [cellKey(p.month, p.day), p.valueId])),
    [pixels]
  );
  const colorByValueId = useMemo(() => new Map(values.map((v) => [v.id, v.color])), [values]);
  function getColor(month: number, day: number): string | null {
    const valueId = valueIdByCell.get(cellKey(month, day));
    return valueId ? (colorByValueId.get(valueId) ?? null) : null;
  }

  // Bod 3.22: hodnota pouzita v mriezke sa pri mazani este pyta na nahradu
  // - pocitane z aktualnych (optimistickych) pixelov, nie z DB dopytu navyse.
  const usedValueIds = useMemo(
    () => new Set(pixels.map((p) => p.valueId).filter((id): id is string => id != null)),
    [pixels]
  );

  const calendarYear = effectiveYear(year);
  const today = new Date();
  function isToday(month: number, day: number): boolean {
    return day === today.getDate() && month === today.getMonth() + 1 && calendarYear === today.getFullYear();
  }

  function setCell(month: number, day: number, valueId: string | null) {
    startTransition(async () => {
      setOptimisticPixels({ day, month, valueId });
      await setPixel(month, day, valueId);
    });
  }

  // Dvojklik (aj dvojite tuknutie) na tu istu bunku ju vymaze. Prvy klik
  // maluje hned (necaka, ci pride druhy), druhy ho potom zmaze. Cas medzi
  // klikmi meriame sami - rovnako pre mys aj dotyk.
  const lastClickRef = useRef<{ key: string; time: number } | null>(null);
  function handleCellClick(month: number, day: number) {
    const key = cellKey(month, day);
    const now = Date.now();
    const last = lastClickRef.current;
    const isDoubleClick = last != null && last.key === key && now - last.time < DOUBLE_CLICK_MS;
    // Po dvojkliku sa pocita odznova - treti klik zase maluje.
    lastClickRef.current = isDoubleClick ? null : { key, time: now };
    if (isDoubleClick) {
      setCell(month, day, null);
      return;
    }
    if (!selectedId) return;
    // Ziadne prepinanie/cyklovanie - klik vzdy nastavi presne to, co je
    // prave vybrane v palete (aj ked to je "guma").
    setCell(month, day, selectedId === ERASER_ID ? null : selectedId);
  }

  function handleDeleteValue(valueId: string, replacementValueId?: string | null) {
    startTransition(async () => {
      await deleteValue(valueId, replacementValueId);
    });
  }

  // Prilepena hlavicka mesiacov (zobrazenie "mesiace v stlpcoch") sedi
  // presne pod prilepenou paletou - jej vyska sa meni (otvoreny formular
  // na pridanie hodnoty, zalomenie cipov), preto sa meria, nie odhaduje.
  // Callback ref (nie jednorazovy useEffect) - meranie sa zapne vzdy, ked
  // element palety vznikne, a hned prvykrat zmeria (bez cakania na prvy
  // callback ResizeObservera).
  const paletteRef = useCallback((palette: HTMLDivElement | null) => {
    const root = palette?.parentElement;
    if (!palette || !root) return;
    const update = () => root.style.setProperty("--palette-h", `${palette.offsetHeight}px`);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(palette);
    return () => observer.disconnect();
  }, []);

  const gridProps = {
    monthNames,
    year: calendarYear,
    getColor,
    isToday,
    canPaint: selectedId != null,
    onCellClick: handleCellClick,
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3 flex-wrap mt-2 mb-3">
        <SheetNameHeader sheetId={sheetId} name={sheetName} renameSheet={renameSheet} deleteSheet={deleteSheet} />
        <ViewSwitcher view={view} onChange={changeView} />
      </div>

      <ValuePalette
        ref={paletteRef}
        values={orderedValues}
        selectedId={selectedId}
        editMode={editMode}
        onSelect={setPickedId}
        onReorder={handleReorder}
        addValue={addValue}
      />

      {editMode && (
        <ValueManager
          values={orderedValues}
          usedValueIds={usedValueIds}
          onDelete={handleDeleteValue}
          updateValueColor={updateValueColor}
          updateValueName={updateValueName}
        />
      )}

      {view === "calendar" ? (
        <CalendarGrid {...gridProps} weekdayNames={weekdayNames} />
      ) : (
        <YearGrid {...gridProps} layout={view} />
      )}
    </div>
  );
}

// Prepinac zobrazenia - "Auto" (default) sa riadi orientaciou obrazovky
// (na vysku mesiace v stlpcoch, na sirku v riadkoch), ostatne vyber
// natvrdo; volba sa pamata na zariadeni pre vsetky sheety (sheet-view.ts).
function ViewSwitcher({ view, onChange }: { view: SheetView; onChange: (view: SheetView) => void }) {
  const t = useT();
  const options: { view: SheetView; label: string; icon: ReactNode }[] = [
    { view: "auto", label: t.sheet.viewAuto, icon: <ViewAutoIcon /> },
    { view: "columns", label: t.sheet.viewColumns, icon: <ViewColumnsIcon /> },
    { view: "rows", label: t.sheet.viewRows, icon: <ViewRowsIcon /> },
    { view: "calendar", label: t.sheet.viewCalendar, icon: <ViewCalendarIcon /> },
  ];

  return (
    <div
      role="group"
      aria-label={t.sheet.viewSwitcherLabel}
      className="flex items-center gap-0.5 p-0.5 rounded-lg shrink-0"
      style={{ border: "1px solid var(--border)", backgroundColor: "var(--card-fill)" }}
    >
      {options.map((option) => (
        <button
          key={option.view}
          type="button"
          aria-pressed={view === option.view}
          aria-label={option.label}
          title={option.label}
          onClick={() => onChange(option.view)}
          className={
            "p-1.5 flex items-center justify-center rounded-md " +
            (view === option.view
              ? "bg-[var(--accent-soft)] text-[var(--accent)]"
              : "text-[var(--text-muted)] hover:bg-[var(--border-hover)] hover:text-[var(--ink)]")
          }
        >
          {option.icon}
        </button>
      ))}
    </div>
  );
}

// Bod 3.13: premenovanie sheetu (v edit rezime) - analogicke ku
// CategoryNameHeader v objects/[categoryId]/category-editor.tsx. Vymazanie
// je tu AJ v "menu sheetov" (SheetsGrid) - obe cesty su zamerne dostupne.
function SheetNameHeader({
  sheetId,
  name,
  renameSheet,
  deleteSheet,
}: {
  sheetId: string;
  name: string;
  renameSheet: RenameSheetAction;
  deleteSheet: DeleteSheetAction;
}) {
  const t = useT();
  const editMode = useEditMode();
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(renameSheet, { error: null });
  const [deleting, startDeleteTransition] = useTransition();

  if (!editMode) {
    return <h1 className="min-w-0 break-words">{name}</h1>;
  }

  return (
    <div className="flex-1 min-w-0">
      {/* Tlacidlo pod nazvom (ako na stranke kategorie) - vedla neho by na
          mobile vedla prepinaca zobrazenia ostalo na nazov len par pismen. */}
      <form action={formAction} className="flex flex-col items-start gap-2">
        <input
          type="text"
          name="name"
          defaultValue={name}
          required
          className="text-2xl font-semibold border-b w-full min-w-0 focus:outline-none bg-transparent"
          style={{ borderColor: "var(--border)" }}
        />
        <button
          type="submit"
          disabled={isPending}
          className="text-sm px-3 py-1 rounded border disabled:opacity-50"
          style={{ borderColor: "var(--border)" }}
        >
          {isPending ? t.sheet.savingButton : t.sheet.saveNameButton}
        </button>
      </form>
      {state.error && <p className="text-red-600 text-sm mt-1">{state.error}</p>}
      <button
        type="button"
        onClick={() => {
          if (!window.confirm(t.sheet.deleteSheetConfirm(name))) {
            return;
          }
          startDeleteTransition(async () => {
            await deleteSheet(sheetId);
            router.push("/");
          });
        }}
        disabled={deleting}
        className="text-red-600 text-sm mt-2 hover:underline disabled:opacity-50"
      >
        {deleting ? t.sheet.deletingButton : t.sheet.deleteSheetButton}
      </button>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from "react";
import type { SheetSummary } from "@/lib/sheets";
import type { CreateSheetAction, ReorderSheetsAction, DeleteSheetAction } from "./sheet-actions";
import { useT } from "@/i18n/context";
import {
  SheetThumbnail,
  AddSheetTile,
  THUMB_WIDTH,
  THUMB_HEIGHT,
  PINK_BORDER,
} from "./sheets-carousel";

const TILE_WIDTH = THUMB_WIDTH + 24;
const TILE_HEIGHT = THUMB_HEIGHT + 40;

// Kolko pixelov sa musi ukazovatko pohnut od stlacenia, aby sme to brali
// ako tahanie (nie obycajny klik/tap, ktory ma normalne otvorit sheet).
// Na dotyk potrebujeme vyssiu hranicu ako pre mys - prst prirodzene
// mierne "zakolisa" aj pri obycajnom ťuknuti, s 6px by sa vela tapov
// omylom vyhodnotilo ako zaciatok tahania a klik by sa nespravne potlacil.
const DRAG_THRESHOLD_MOUSE = 6;
const DRAG_THRESHOLD_TOUCH = 16;

// Na dotyk sa tahanie "odomkne" az po tomto case drzania na mieste - presne
// ako "jiggle mode" pri presúvaní ikon na telefone. Kym sa neodomkne, vacsi
// pohyb prsta (nad TOUCH_HOLD_CANCEL_DISTANCE) sa berie ako bezny scroll
// zoznamu, nie zaciatok tahania - inak by sa nedalo v menu vobec normalne
// scrollovat, lebo kazdy swipe by ihned spustil presun dlazdice.
const TOUCH_HOLD_MS = 450;
const TOUCH_HOLD_CANCEL_DISTANCE = 10;

type DragState = { id: string; x: number; y: number; overIndex: number };

// "Menu sheetov" (otvara sa z tlacidla ☰ na stranke sheetu, bod 3.11/3.12) -
// na rozdiel od vodorovneho karuselu na hlavnej stranke su tu sheety v
// mriezke (riadky a stlpce, koľko sa ich zmesti do sirky). Ked ich je viac
// nez sa zmesti na vysku, mriezka sa da scrollovat dole (nie do strany).
//
// Bod 3.14: drzanim a tahanim dlazdice ju P moze presunut na ine miesto v
// zozname. Zamerne NEpouzivame naitivne HTML5 drag-and-drop (draggable="true"
// + dragstart/dragover/drop) - to je v realnom pouzivani (najma na trackpade)
// nespolahlive, nedava ziadnu kontrolu nad vizualom pocas tahania a v tejto
// appke sposobovalo, ze sa dlazdica pri drzani "stratila" a presun sa
// vykonal az niekde nahodne pri dalsom kliku. Namiesto toho pocitame cele
// tahanie sami cez Pointer Events (funguju rovnako pre mys aj dotyk):
// dlazdica pod kurzorom sa hned zobrazuje ako "duch" (plava s kurzorom) a
// na cielovej pozicii v mriezke sa ukazuje prazdny orámovaný slot.
export function SheetsGrid({
  sheets: sheetsProp,
  createSheet,
  reorderSheets,
  deleteSheet,
  editMode,
  currentSheetId,
}: {
  sheets: SheetSummary[];
  createSheet: CreateSheetAction;
  reorderSheets: ReorderSheetsAction;
  deleteSheet: DeleteSheetAction;
  // Bod: presuvanie poradia AJ mazanie su dostupne len v tomto (menu-
  // lokalnom) edit rezime, nie vzdy ako predtym - predchadza omylom pri
  // obycajnom prezerani zoznamu.
  editMode: boolean;
  // Ak P zmaze prave PREZERANY sheet priamo z menu, treba ho presmerovat
  // na hlavnu stranku (jeho vlastna stranka by inak 404-la).
  currentSheetId: string;
}) {
  const t = useT();
  const [sheets, setSheets] = useState(sheetsProp);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const [drag, setDrag] = useState<DragState | null>(null);
  const dragRef = useRef<DragState | null>(null);
  useEffect(() => {
    dragRef.current = drag;
  });

  // Polohy aktualne vykreslenych dlazdic (bez tahanej) - potrebne pocas
  // pohybu ukazovatka na zistenie, nad/vedla ktorej dlazdice prave je.
  const tileRefs = useRef(new Map<string, HTMLDivElement>());

  // Kym tahanie prave prebieha (aj po pusteni, kym cakame na server),
  // ignorujeme zmeny props - inak by prepisali rozohranu/cerstvo optimisticky
  // ulozenu animaciu skorej, nez sa zmena prejavi zo servera.
  useEffect(() => {
    setSheets((current) => (dragRef.current === null ? sheetsProp : current));
  }, [sheetsProp]);

  // Ci prave prebehol realny presun (nie len klik) - kontroluje Link, ci ma
  // potlacit navigaciu na nasledujuci "click" (ten sa spusti tesne po
  // pusteni tlacidla, PRED akymkolvek setTimeout). Cistime ju aj sami
  // kratko po pusteni (nie len v onClick Linku) - ak by "pointerup" nastal
  // mimo akejkolvek dlazdice (napr. nad prazdnym slotom), ziadny "click" by
  // ju inak nikdy nezmazal a nasledujuci, uplne samostatny klik na inu
  // dlazdicu by sa nespravne zablokoval.
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
    const dragged = sheets.find((s) => s.id === id);
    if (!dragged) return;
    const others = sheets.filter((s) => s.id !== id);
    const clamped = Math.max(0, Math.min(overIndex, others.length));
    const reordered = [
      ...others.slice(0, clamped),
      dragged,
      ...others.slice(clamped),
    ];
    setSheets(reordered);
    startTransition(() => {
      reorderSheets(reordered.map((s) => s.id));
    });
  }

  function handleDelete(e: ReactMouseEvent, sheet: SheetSummary) {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(t.sheetsBrowse.deleteConfirmMessage(sheet.name))) return;
    setSheets((current) => current.filter((s) => s.id !== sheet.id));
    startTransition(async () => {
      await deleteSheet(sheet.id);
      if (sheet.id === currentSheetId) {
        router.push("/");
      }
    });
  }

  // Podla aktualnej polohy ukazovatka zisti, PRED ktorou z (uz vykreslenych,
  // t.j. bez tahanej) dlazdic by sa mala tahana dlazdica vlozit. Hlada
  // dlazdicu, ktorej STRED je ukazovatku najblizsie (nie prvu dlazdicu v
  // rovnakom riadku) - v mriezke s viac stlpcami maju vsetky dlazdice v
  // jednom riadku rovnake y-suradnice, takze "prva podla riadku" by vzdy
  // rozhodovala len podla stredu UPLNE prvej dlazdice v riadku a niektore
  // miesta v mriezke by tak boli natrvalo nedosiahnutelne.
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

  // Pocuvame na "window" (nie na pointer capture jednej dlazdice) - tahanie
  // tak spolahlivo pokracuje aj ked kurzor medzitym prejde nad inym
  // elementom (inou dlazdicou, medzerou v mriezke, ...), bez zavislosti na
  // tom, ci prehliadac/vstupne zariadenie riadne podporuje pointer capture.
  function handlePointerDown(e: ReactPointerEvent<HTMLDivElement>, sheetId: string) {
    if (e.button !== 0 || dragRef.current !== null) return;
    const startX = e.clientX;
    const startY = e.clientY;
    const isTouch = e.pointerType === "touch";
    const threshold = isTouch ? DRAG_THRESHOLD_TOUCH : DRAG_THRESHOLD_MOUSE;
    // Mys je "odomknuta" hned - konflikt so scrollovanim tam nehrozi (mys
    // scrolluje kolieskom, nie tahanim). Na dotyk az po TOUCH_HOLD_MS
    // drzania na mieste (pozri unlockTimer nizsie).
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
        // Prst sa este len "podrzava" (cakame na TOUCH_HOLD_MS) - ak sa
        // medzitym vyrazne pohne, znamena to, ze P chcel scrollovat, nie
        // tahat. Prestaneme sledovat a pustime prirodzeny scroll zoznamu
        // (nevolame preventDefault, takze ho prehliadac spracuje sam).
        if (Math.hypot(ev.clientX - startX, ev.clientY - startY) > TOUCH_HOLD_CANCEL_DISTANCE) {
          cleanup();
        }
        return;
      }
      if (!dragging) {
        if (Math.hypot(ev.clientX - startX, ev.clientY - startY) < threshold) return;
        dragging = true;
        justDraggedRef.current = true;
        // Poistka pre pripad, ze by z akehokolvek dovodu (prehliadac/OS
        // zvlastnost) nedosiel ani "pointerup" ani "pointercancel" - inak
        // by "duch" ostal navzdy zamrznuty na obrazovke.
        watchdog = setTimeout(handleCancel, 15000);
      }
      // Az od tejto chvile (skutocne tahanie) potlacime prirodzeny scroll -
      // dovtedy bol prst prakticky na mieste, takze prehliadac este nestihol
      // vlastny scroll spustit.
      ev.preventDefault();
      const otherIds = sheets.filter((s) => s.id !== sheetId).map((s) => s.id);
      const overIndex = computeOverIndex(otherIds, ev.clientX, ev.clientY);
      const next = { id: sheetId, x: ev.clientX, y: ev.clientY, overIndex };
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
  const others = isDragging ? sheets.filter((s) => s.id !== drag.id) : sheets;
  const dropIndex = isDragging
    ? Math.max(0, Math.min(drag.overIndex, others.length))
    : null;
  const draggedSheet = isDragging ? sheets.find((s) => s.id === drag.id) : undefined;

  return (
    <div className="max-h-[70vh] overflow-y-auto pr-1">
      <div
        className="grid gap-3 justify-center"
        style={{ gridTemplateColumns: `repeat(auto-fill, ${TILE_WIDTH}px)` }}
      >
        {others.map((sheet, index) => (
          <div key={sheet.id} style={{ display: "contents" }}>
            {dropIndex === index && <DropSlot />}
            <div
              ref={(el) => {
                if (el) tileRefs.current.set(sheet.id, el);
                else tileRefs.current.delete(sheet.id);
              }}
              // Presuvanie je dostupne len v edit rezime - inak by sa
              // obycajne prezeranie/scrollovanie zoznamu mohlo omylom
              // vyhodnotit ako zaciatok tahania.
              onPointerDown={(e) => editMode && handlePointerDown(e, sheet.id)}
              // "pan-y" (nie "none") - dovoli prirodzeny vertikalny scroll
              // zoznamu, kym sa tahanie po TOUCH_HOLD_MS neodomkne.
              // "WebkitTouchCallout: none" potlaci Safari-ho VLASTNE dlhe
              // podrzanie na odkaze (nahlad stranky/"Open"/"Copy" menu) -
              // bez toho by sa toto natívne menu preplietalo s nasim
              // vlastnym "podrz a tahaj".
              style={{
                position: "relative",
                cursor: editMode ? "grab" : "pointer",
                touchAction: "pan-y",
                WebkitTouchCallout: "none",
              }}
            >
              <Link
                href={`/sheets/${sheet.id}`}
                draggable={false}
                onClick={(e) => {
                  if (justDraggedRef.current) {
                    e.preventDefault();
                    justDraggedRef.current = false;
                  }
                }}
                className="flex flex-col items-center justify-center gap-2 hover:shadow-sm transition-shadow p-2"
                style={{
                  width: TILE_WIDTH,
                  height: TILE_HEIGHT,
                  borderRadius: 16,
                  border: `2px solid ${PINK_BORDER}`,
                  background: "#fff",
                  WebkitTouchCallout: "none",
                }}
              >
                <SheetThumbnail pixels={sheet.pixels} year={sheet.year} />
                <span className="px-2 text-xs text-gray-500 truncate w-full text-center">
                  {sheet.name}
                </span>
              </Link>
              {editMode && (
                <button
                  type="button"
                  onClick={(e) => handleDelete(e, sheet)}
                  title={t.sheetsBrowse.deleteButtonTitle}
                  aria-label={t.sheetsBrowse.deleteButtonAriaLabel(sheet.name)}
                  className="absolute top-1 left-1 w-6 h-6 flex items-center justify-center rounded-full bg-white text-gray-400 hover:text-red-600 shadow text-sm leading-none"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        ))}
        {dropIndex === others.length && <DropSlot />}

        <AddSheetTile createSheet={createSheet} />
      </div>

      {/* "Duch" tahanej dlazdice - plava s kurzorom, aby bolo jasne, co sa
          prave presuva a kam presne smeruje (bod: "cursor of where am i
          moving it"). */}
      {isDragging && draggedSheet && (
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
          <SheetThumbnail pixels={draggedSheet.pixels} year={draggedSheet.year} />
          <span className="px-2 text-xs text-gray-500 truncate w-full text-center">
            {draggedSheet.name}
          </span>
        </div>
      )}
    </div>
  );
}

// Prazdny orámovaný "slot" oznacujuci, kam by tahana dlazdica pristala,
// keby P prave teraz pustil.
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

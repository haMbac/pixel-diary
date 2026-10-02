"use client";

import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

// Rovnake spravanie ako presuvanie dlazdic v menu sheetov (sheets-grid.tsx):
// mys tahat hned po malom pohybe, prst az po kratkom podrzani na mieste -
// inak by kazdy pokus o scroll stranky zacal presuvat.
const DRAG_THRESHOLD_MOUSE = 6;
const DRAG_THRESHOLD_TOUCH = 16;
const TOUCH_HOLD_MS = 450;
const TOUCH_HOLD_CANCEL_DISTANCE = 10;

export type DragState = {
  id: string;
  x: number;
  y: number;
  overIndex: number;
  width: number;
  height: number;
};

// Presuvanie poradia poloziek tahanim (pointer events). Kym sa taha, tahana
// polozka v zozname chyba (vykresli sa ako "duch" pri kurzore) a dropIndex
// hovori, kam by pristala - komponent tam vykresli prazdny slot.
export function useDragReorder(ids: string[], onReorder: (orderedIds: string[]) => void) {
  const [drag, setDrag] = useState<DragState | null>(null);
  const dragRef = useRef<DragState | null>(null);
  useEffect(() => {
    dragRef.current = drag;
  });

  const itemEls = useRef(new Map<string, HTMLElement>());
  // Klik, ktory prehliadac posle hned po pusteni tahanej polozky, nesmie
  // polozku zaroven aj "vybrat".
  const justDraggedRef = useRef(false);

  function itemRef(id: string) {
    return (el: HTMLElement | null) => {
      if (el) itemEls.current.set(id, el);
      else itemEls.current.delete(id);
    };
  }

  function consumeClickAfterDrag(): boolean {
    if (!justDraggedRef.current) return false;
    justDraggedRef.current = false;
    return true;
  }

  // Polozka, ktorej STRED je kurzoru najblizsie (riadky cipov su rozne
  // siroke a zalamuju sa), a podla strany od jej stredu pred/za nu.
  function computeOverIndex(otherIds: string[], clientX: number, clientY: number): number {
    let closestIndex = otherIds.length;
    let closestDist = Infinity;
    let insertBefore = true;
    otherIds.forEach((id, index) => {
      const el = itemEls.current.get(id);
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dist = Math.hypot(clientX - centerX, clientY - centerY);
      if (dist < closestDist) {
        closestDist = dist;
        closestIndex = index;
        insertBefore = clientX < centerX;
      }
    });
    if (closestIndex === otherIds.length) return otherIds.length;
    return insertBefore ? closestIndex : closestIndex + 1;
  }

  function reset() {
    setDrag(null);
    dragRef.current = null;
  }

  function startDrag(e: ReactPointerEvent<HTMLElement>, id: string) {
    if (e.button !== 0 || dragRef.current !== null) return;
    const startX = e.clientX;
    const startY = e.clientY;
    const isTouch = e.pointerType === "touch";
    const threshold = isTouch ? DRAG_THRESHOLD_TOUCH : DRAG_THRESHOLD_MOUSE;
    let unlocked = !isTouch;
    let dragging = false;
    let size = { width: 0, height: 0 };
    let watchdog: ReturnType<typeof setTimeout> | undefined;
    const unlockTimer = isTouch
      ? setTimeout(() => {
          unlocked = true;
        }, TOUCH_HOLD_MS)
      : undefined;

    function handleMove(ev: PointerEvent) {
      if (!unlocked) {
        // Prst sa pohol skor, nez sa tahanie odomklo - P scrolluje.
        if (Math.hypot(ev.clientX - startX, ev.clientY - startY) > TOUCH_HOLD_CANCEL_DISTANCE) {
          cleanup();
        }
        return;
      }
      if (!dragging) {
        if (Math.hypot(ev.clientX - startX, ev.clientY - startY) < threshold) return;
        dragging = true;
        justDraggedRef.current = true;
        const rect = itemEls.current.get(id)?.getBoundingClientRect();
        size = { width: rect?.width ?? 0, height: rect?.height ?? 0 };
        // Poistka, keby neprisiel ani pointerup ani pointercancel - inak by
        // duch ostal navzdy zamrznuty na obrazovke.
        watchdog = setTimeout(handleCancel, 15000);
      }
      ev.preventDefault();
      const otherIds = ids.filter((other) => other !== id);
      const next = {
        id,
        x: ev.clientX,
        y: ev.clientY,
        overIndex: computeOverIndex(otherIds, ev.clientX, ev.clientY),
        ...size,
      };
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
      const current = dragRef.current;
      if (dragging && current) {
        const others = ids.filter((other) => other !== current.id);
        const index = Math.max(0, Math.min(current.overIndex, others.length));
        const reordered = [...others.slice(0, index), current.id, ...others.slice(index)];
        if (reordered.some((other, i) => other !== ids[i])) onReorder(reordered);
      }
      reset();
      // Ak pustenie nebolo nad ziadnou polozkou, ziadny click by priznak
      // nezmazal a zablokoval by nasledujuci, uplne samostatny klik.
      setTimeout(() => {
        justDraggedRef.current = false;
      }, 0);
    }

    function handleCancel() {
      cleanup();
      reset();
      setTimeout(() => {
        justDraggedRef.current = false;
      }, 0);
    }

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleCancel);
  }

  const others = drag ? ids.filter((id) => id !== drag.id) : ids;
  const dropIndex = drag ? Math.max(0, Math.min(drag.overIndex, others.length)) : null;

  return { drag, others, dropIndex, itemRef, startDrag, consumeClickAfterDrag };
}

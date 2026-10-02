"use client";

import { useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { DEFAULT_ICONS } from "@/lib/icons";
import { IconGlyph } from "./icon-glyph";
import { uploadIcon } from "./icon-actions";
import { useT } from "@/i18n/context";

const VIEWPORT_SIZE = 240;
const EXPORT_SIZE = 480;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

type Offset = { x: number; y: number };

function clampOffset(
  offset: Offset,
  effectiveScale: number,
  naturalWidth: number,
  naturalHeight: number
): Offset {
  const halfExcessX = (naturalWidth * effectiveScale - VIEWPORT_SIZE) / 2;
  const halfExcessY = (naturalHeight * effectiveScale - VIEWPORT_SIZE) / 2;
  return {
    x: Math.max(-halfExcessX, Math.min(halfExcessX, offset.x)),
    y: Math.max(-halfExcessY, Math.min(halfExcessY, offset.y)),
  };
}

// Vyber ikony/fotky pre kategoriu alebo objekt - tlacidlo s nahladom
// aktualnej ikony, ktore otvori modal s dvomi zalozkami: "Predvolené"
// (mriezka pixelovych ikon) a "Vlastná fotka" (nahratie + orezanie na
// stvorec). Orezavanie je vlastna implementacia cez canvas + Pointer
// Events (rovnaky pristup ako drag-reorder v sheets-grid.tsx), nie
// externa kniznica.
export function IconPicker({
  value,
  onChange,
  allowClear,
  size = 56,
  label,
}: {
  value: string | null;
  onChange: (value: string | null) => void;
  allowClear?: boolean;
  size?: number;
  label?: string;
}) {
  const t = useT();
  const resolvedLabel = label ?? t.iconPicker.changeIconLabel;

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"default" | "photo">("default");

  // Stav orezavacieho nastroja - "photo" zalozka.
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });
  const [loadError, setLoadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; startOffset: Offset } | null>(null);

  function closeAndReset() {
    setOpen(false);
    setTab("default");
    if (imgUrl) URL.revokeObjectURL(imgUrl);
    setImgUrl(null);
    setNaturalSize(null);
    setZoom(MIN_ZOOM);
    setOffset({ x: 0, y: 0 });
    setLoadError(null);
    setUploadError(null);
  }

  function pickDefault(key: string) {
    onChange(key);
    closeAndReset();
  }

  function clearOverride() {
    onChange(null);
    closeAndReset();
  }

  function handleFile(file: File) {
    setLoadError(null);
    const url = URL.createObjectURL(file);
    setImgUrl(url);
    setNaturalSize(null);
    setZoom(MIN_ZOOM);
    setOffset({ x: 0, y: 0 });
  }

  function handleImgLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const img = e.currentTarget;
    setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
  }

  function handleImgError() {
    // Typicky HEIC/HEIF z iPhonu, ktore prehliadac nevie dekodovat do
    // <img>/<canvas> - bez tejto hlasky by orezavaci nastroj ostal
    // prazdny bez vysvetlenia.
    setLoadError(t.iconPicker.heicLoadError);
    if (imgUrl) URL.revokeObjectURL(imgUrl);
    setImgUrl(null);
  }

  function baseScale(w: number, h: number): number {
    return Math.max(VIEWPORT_SIZE / w, VIEWPORT_SIZE / h);
  }

  function handlePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (!naturalSize) return;
    dragRef.current = { startX: e.clientX, startY: e.clientY, startOffset: offset };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!dragRef.current || !naturalSize) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const effectiveScale = baseScale(naturalSize.w, naturalSize.h) * zoom;
    setOffset(
      clampOffset(
        { x: dragRef.current.startOffset.x + dx, y: dragRef.current.startOffset.y + dy },
        effectiveScale,
        naturalSize.w,
        naturalSize.h
      )
    );
  }

  function handlePointerUp() {
    dragRef.current = null;
  }

  function handleZoomChange(next: number) {
    if (!naturalSize) {
      setZoom(next);
      return;
    }
    const effectiveScale = baseScale(naturalSize.w, naturalSize.h) * next;
    setZoom(next);
    setOffset((o) => clampOffset(o, effectiveScale, naturalSize.w, naturalSize.h));
  }

  async function handleUse() {
    if (!imgUrl || !naturalSize) return;
    setUploading(true);
    setUploadError(null);

    const effectiveScale = baseScale(naturalSize.w, naturalSize.h) * zoom;
    const imgLeft = VIEWPORT_SIZE / 2 - (naturalSize.w * effectiveScale) / 2 + offset.x;
    const imgTop = VIEWPORT_SIZE / 2 - (naturalSize.h * effectiveScale) / 2 + offset.y;
    const sx = -imgLeft / effectiveScale;
    const sy = -imgTop / effectiveScale;
    const sSize = VIEWPORT_SIZE / effectiveScale;

    const image = new Image();
    image.src = imgUrl;
    await image.decode();

    const canvas = document.createElement("canvas");
    canvas.width = EXPORT_SIZE;
    canvas.height = EXPORT_SIZE;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(image, sx, sy, sSize, sSize, 0, 0, EXPORT_SIZE, EXPORT_SIZE);

    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          setUploading(false);
          setUploadError(t.iconPicker.cropFailedError);
          return;
        }
        const formData = new FormData();
        formData.append("file", blob, "icon.jpg");
        const result = await uploadIcon(formData);
        setUploading(false);
        if (result.error || !result.url) {
          setUploadError(result.error ?? t.iconPicker.uploadFailedError);
          return;
        }
        onChange(result.url);
        closeAndReset();
      },
      "image/jpeg",
      0.9
    );
  }

  const effectiveScale = naturalSize ? baseScale(naturalSize.w, naturalSize.h) * zoom : 1;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={resolvedLabel}
        aria-label={resolvedLabel}
        style={{
          width: size,
          height: size,
          borderRadius: 10,
          border: "1px solid var(--border)",
          background: "var(--card-fill)",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <IconGlyph value={value} />
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-40"
          onClick={closeAndReset}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ border: "2px solid var(--border)", borderRadius: 20 }}
            className="bg-white p-5 max-w-sm w-full max-h-[85vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-medium">{t.iconPicker.modalTitle}</h2>
              <button
                type="button"
                onClick={closeAndReset}
                aria-label={t.iconPicker.closeButton}
                title={t.iconPicker.closeButton}
                className="text-gray-400 hover:text-gray-600 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => setTab("default")}
                className="text-sm px-3 py-1 rounded border"
                style={{
                  borderColor: "var(--border)",
                  background: tab === "default" ? "var(--accent-soft)" : "transparent",
                }}
              >
                {t.iconPicker.defaultTab}
              </button>
              <button
                type="button"
                onClick={() => setTab("photo")}
                className="text-sm px-3 py-1 rounded border"
                style={{
                  borderColor: "var(--border)",
                  background: tab === "photo" ? "var(--accent-soft)" : "transparent",
                }}
              >
                {t.iconPicker.customPhotoTab}
              </button>
            </div>

            {tab === "default" && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: 10,
                }}
              >
                {DEFAULT_ICONS.map((icon) => (
                  <button
                    key={icon.key}
                    type="button"
                    onClick={() => pickDefault(icon.key)}
                    title={icon.label}
                    style={{
                      aspectRatio: "1",
                      borderRadius: 10,
                      border:
                        value === icon.key
                          ? "2px solid var(--accent)"
                          : "1px solid var(--border)",
                      background: "var(--card-fill)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <IconGlyph value={icon.key} />
                  </button>
                ))}
              </div>
            )}

            {tab === "photo" && (
              <div className="flex flex-col gap-3">
                {!imgUrl && (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFile(file);
                    }}
                    className="text-sm"
                  />
                )}

                {loadError && <p className="text-red-600 text-sm">{loadError}</p>}

                {imgUrl && (
                  <>
                    <div
                      onPointerDown={handlePointerDown}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
                      onPointerCancel={handlePointerUp}
                      style={{
                        width: VIEWPORT_SIZE,
                        height: VIEWPORT_SIZE,
                        margin: "0 auto",
                        borderRadius: 10,
                        overflow: "hidden",
                        border: "1px solid var(--border)",
                        position: "relative",
                        touchAction: "none",
                        cursor: "grab",
                        background: "#f3f4f6",
                      }}
                    >
                      {naturalSize && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={imgUrl}
                          alt=""
                          draggable={false}
                          onLoad={handleImgLoad}
                          onError={handleImgError}
                          style={{
                            position: "absolute",
                            left: VIEWPORT_SIZE / 2 - (naturalSize.w * effectiveScale) / 2 + offset.x,
                            top: VIEWPORT_SIZE / 2 - (naturalSize.h * effectiveScale) / 2 + offset.y,
                            width: naturalSize.w * effectiveScale,
                            height: naturalSize.h * effectiveScale,
                            userSelect: "none",
                          }}
                        />
                      )}
                      {!naturalSize && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={imgUrl}
                          alt=""
                          onLoad={handleImgLoad}
                          onError={handleImgError}
                          style={{ display: "none" }}
                        />
                      )}
                    </div>

                    <label className="text-xs text-gray-500 flex items-center gap-2">
                      {t.iconPicker.zoomLabel}
                      <input
                        type="range"
                        min={MIN_ZOOM}
                        max={MAX_ZOOM}
                        step={0.05}
                        value={zoom}
                        onChange={(e) => handleZoomChange(Number(e.target.value))}
                        className="flex-1"
                      />
                    </label>

                    {uploadError && <p className="text-red-600 text-sm">{uploadError}</p>}

                    <button
                      type="button"
                      onClick={handleUse}
                      disabled={uploading}
                      className="bg-black text-white rounded px-4 py-2 text-sm disabled:opacity-50"
                    >
                      {uploading ? t.iconPicker.uploadingButton : t.iconPicker.useButton}
                    </button>
                  </>
                )}
              </div>
            )}

            {allowClear && (
              <button
                type="button"
                onClick={clearOverride}
                className="text-sm text-gray-500 hover:text-gray-700 mt-4"
              >
                {t.iconPicker.useCategoryIconButton}
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}

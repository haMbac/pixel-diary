import { resolveIcon } from "@/lib/icons";

// Vykresli ikonu/fotku kategorie alebo objektu - zdielane medzi dlazdicou
// kategorie (objects-carousel.tsx), riadkom objektu (category-editor.tsx) a
// samotnym IconPicker-om (nahlad aktualne vybratej ikony).
export function IconGlyph({
  value,
  color = "var(--accent)",
  fit = "contain",
}: {
  value: string | null | undefined;
  color?: string;
  fit?: "contain" | "cover";
}) {
  const resolved = resolveIcon(value);

  if (resolved.kind === "photo") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={resolved.url}
        alt=""
        style={{
          width: "100%",
          height: "100%",
          objectFit: fit,
          display: "block",
        }}
      />
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      width="60%"
      height="60%"
      fill={color}
      aria-hidden="true"
    >
      <path d={resolved.icon.path} />
    </svg>
  );
}

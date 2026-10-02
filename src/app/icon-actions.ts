"use server";

import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { put } from "@vercel/blob";

export type UploadIconResult = { url: string | null; error: string | null };

// Orezany obrazok z canvasu (IconPicker) je vzdy maly a pevnej velkosti -
// tento limit je len poistka proti zjavne nespravnemu/skodlivemu vstupu.
const MAX_BYTES = 3 * 1024 * 1024;
const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

// Na Verceli ide fotka do Vercel Blob (disk servera tam nie je trvaly -
// subor by po dalsom deployi zmizol). Lokalne ("npm run dev") bez tokenu
// do Blobu sa uklada na disk do "public/uploads", odkial ju Next.js servuje
// ako staticky subor.
const USE_BLOB = Boolean(process.env.VERCEL || process.env.BLOB_READ_WRITE_TOKEN);

// Vseobecna akcia (nezavisla od kategorie/objektu) - volajuci si sam
// rozhodne, kam vratenu URL adresu ulozi (ObjCategory.icon alebo
// Objekt.icon).
export async function uploadIcon(formData: FormData): Promise<UploadIconResult> {
  "use server";
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { url: null, error: "Žiadny súbor." };
  }
  const ext = EXT_BY_TYPE[file.type];
  if (!ext) {
    return { url: null, error: "Nepodporovaný formát obrázka." };
  }
  if (file.size === 0 || file.size > MAX_BYTES) {
    return { url: null, error: "Obrázok je príliš veľký." };
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const filename = `${randomUUID()}.${ext}`;
  if (USE_BLOB) {
    try {
      const blob = await put(`icons/${filename}`, bytes, { access: "public", contentType: file.type });
      return { url: blob.url, error: null };
    } catch (error) {
      console.error("Nahratie fotky do Vercel Blob zlyhalo:", error);
      return { url: null, error: "Fotku sa nepodarilo uložiť." };
    }
  }
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });
  await writeFile(path.join(uploadsDir, filename), bytes);

  return { url: `/uploads/${filename}`, error: null };
}

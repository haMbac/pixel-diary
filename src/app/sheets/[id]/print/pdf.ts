// Minimalny PDF (1 strana = 1 obrazok) bez kniznice - stranu nakresli
// page-render.ts na canvas a tu sa len zabali do PDF. Obrazok je bezstratovo
// komprimovany (FlateDecode cez vstavany CompressionStream prehliadaca), pri
// plochych farbach mriezky je subor maly.

const MM_TO_PT = 72 / 25.4;

// Nazov dokumentu (napr. s diakritikou) ako PDF retazec v UTF-16BE.
function pdfTextString(text: string): string {
  let hex = "FEFF";
  for (let i = 0; i < text.length; i++) hex += text.charCodeAt(i).toString(16).padStart(4, "0").toUpperCase();
  return `<${hex}>`;
}

async function deflate(bytes: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(new CompressionStream("deflate"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

export async function canvasToPdf(
  canvas: HTMLCanvasElement,
  pageWidthMm: number,
  pageHeightMm: number,
  title: string
): Promise<Blob> {
  const { width, height } = canvas;
  const rgba = canvas.getContext("2d")!.getImageData(0, 0, width, height).data;
  const rgb = new Uint8Array(width * height * 3);
  for (let i = 0, j = 0; i < rgba.length; i += 4, j += 3) {
    rgb[j] = rgba[i];
    rgb[j + 1] = rgba[i + 1];
    rgb[j + 2] = rgba[i + 2];
  }
  const image = await deflate(rgb);

  const widthPt = (pageWidthMm * MM_TO_PT).toFixed(2);
  const heightPt = (pageHeightMm * MM_TO_PT).toFixed(2);
  const content = `q\n${widthPt} 0 0 ${heightPt} 0 0 cm\n/Im0 Do\nQ\n`;

  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [];
  let length = 0;
  const push = (chunk: string | Uint8Array) => {
    const bytes = typeof chunk === "string" ? encoder.encode(chunk) : chunk;
    chunks.push(bytes);
    length += bytes.length;
  };
  const startObject = () => {
    offsets.push(length);
    push(`${offsets.length} 0 obj\n`);
  };

  // Hlavicka + binarna znacka (podla specifikacie, aby prenos suboru
  // nepovazoval PDF za text).
  push("%PDF-1.4\n");
  push(new Uint8Array([0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]));

  startObject();
  push("<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
  startObject();
  push("<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");
  startObject();
  push(
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${widthPt} ${heightPt}] ` +
      `/Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`
  );
  startObject();
  push(
    `<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB ` +
      `/BitsPerComponent 8 /Filter /FlateDecode /Length ${image.length} >>\nstream\n`
  );
  push(image);
  push("\nendstream\nendobj\n");
  startObject();
  push(`<< /Length ${encoder.encode(content).length} >>\nstream\n${content}endstream\nendobj\n`);
  startObject();
  push(`<< /Title ${pdfTextString(title)} /Producer (Pixel diar) >>\nendobj\n`);

  const xrefOffset = length;
  push(`xref\n0 ${offsets.length + 1}\n0000000000 65535 f \n`);
  for (const offset of offsets) push(`${String(offset).padStart(10, "0")} 00000 n \n`);
  push(`trailer\n<< /Size ${offsets.length + 1} /Root 1 0 R /Info 6 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`);

  return new Blob(chunks as BlobPart[], { type: "application/pdf" });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Neskor, nie hned - niektore prehliadace (Safari) subor stahuju az po
  // dokonceni klik-handlera.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

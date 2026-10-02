import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/currentUser";
import { getSheetForUser } from "@/lib/sheets";
import { SHEET_VIEW_COOKIE, parseSheetView } from "@/lib/sheet-view";
import { PrintExport } from "./print-export";

type Props = { params: Promise<{ id: string }> };

// Titulok stranky = predvoleny nazov suboru pri "Ulozit ako PDF".
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const user = await getCurrentUser();
  const sheet = await getSheetForUser(id, user.id);
  if (!sheet) return {};
  return { title: sheet.year != null ? `${sheet.name} ${sheet.year}` : sheet.name };
}

// Bod 3.3: export sheetu do PDF cez tlacovy dialog prehliadaca - tato
// stranka je nastavenie (zobrazenie, vyplnene/prazdne, co pridat) + nahlad
// stranky A4, ktora sa potom vytlaci (alebo ulozi ako PDF).
export default async function SheetPrintPage({ params }: Props) {
  const { id } = await params;
  const user = await getCurrentUser();
  const sheet = await getSheetForUser(id, user.id);
  if (!sheet) notFound();

  const savedView = parseSheetView((await cookies()).get(SHEET_VIEW_COOKIE)?.value) ?? "auto";

  return (
    <PrintExport
      sheetId={sheet.id}
      name={sheet.name}
      year={sheet.year}
      values={sheet.values.map((v) => ({ id: v.id, name: v.name, color: v.color }))}
      pixels={sheet.pixels.map((p) => ({ month: p.month, day: p.day, valueId: p.valueId }))}
      savedView={savedView}
    />
  );
}

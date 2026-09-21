import { getCurrentUser } from "@/lib/currentUser";
import { getSheetSummaries } from "@/lib/sheets";
import { createSheet } from "./sheet-actions";
import { SheetsSection } from "./sheets-section";

const CARD_BORDER = "#fbcfe8"; // bledoruzova - docasna, upresni sa neskor

// Toto je Server Component (default v Next.js App Router) - kod v nom
// bezi len na serveri, takze tu mozeme priamo pouzivat Prisma
// (pripojenie na databazu) bez API route.
export default async function HomePage() {
  const user = await getCurrentUser();
  const sheets = await getSheetSummaries(user.id);

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-semibold mb-1">Pixel diár</h1>
      <p className="text-sm text-gray-500 mb-6">Prihlásená ako {user.name}</p>

      <SheetsSection sheets={sheets} createSheet={createSheet} />

      <section
        style={{ border: `2px solid ${CARD_BORDER}`, borderRadius: 20 }}
        className="p-4"
      >
        <h2 className="text-lg font-medium mb-3 px-1">Objekty</h2>
        <p className="text-sm text-gray-400 px-1">Čoskoro.</p>
      </section>
    </main>
  );
}

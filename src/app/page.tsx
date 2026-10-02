import Link from "next/link";
import { getCurrentUser } from "@/lib/currentUser";
import { getSheetSummaries, getSheetsForDailyEntry } from "@/lib/sheets";
import { getCategorySummaries } from "@/lib/objects";
import { createSheet, submitDailyEntry } from "./sheet-actions";
import { createCategory } from "./object-actions";
import { logout } from "./auth-actions";
import { SheetsSection } from "./sheets-section";
import { ObjectsSection } from "./objects-section";
import { DailyEntry } from "./daily-entry";
import { getLocale } from "@/lib/locale";
import { dictionary } from "@/i18n/dictionary";

// Toto je Server Component (default v Next.js App Router) - kod v nom
// bezi len na serveri, takze tu mozeme priamo pouzivat Prisma
// (pripojenie na databazu) bez API route.
export default async function HomePage() {
  const locale = await getLocale();
  const t = dictionary[locale];
  const user = await getCurrentUser();
  const sheets = await getSheetSummaries(user.id);
  const categories = await getCategorySummaries(user.id);
  const dailyEntrySheets = await getSheetsForDailyEntry(user.id);

  return (
    <main className="mx-auto p-4 sm:p-8 pb-24 sm:pb-24 min-w-0 w-full" style={{ maxWidth: "100vw" }}>
      {/* "section-width" + auto margins - PRESNE ta ista sirka/centrovanie
          ako SheetsSection/ObjectsSection nizsie, aby lavy okraj nadpisu
          vzdy sedel s lavym okrajom karty "Sheets" bez ohladu na to, akoze
          sirke (percenta v .section-width v globals.css) alebo na akej
          sirke obrazovky - narozdiel od predtym natvrdo zapisaneho
          "marginLeft: 15%", ktore sedelo len pokial malo ".section-width"
          presne 70%. */}
      <div className="section-width" style={{ marginLeft: "auto", marginRight: "auto" }}>
        <h1 className="mb-1">Pixel diár</h1>
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {t.home.loggedInAs(user.name)}
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/account"
              className="text-sm hover:underline"
              style={{ color: "var(--text-muted)" }}
            >
              {t.home.accountLink}
            </Link>
            <form action={logout}>
              <button
                type="submit"
                className="text-sm hover:underline"
                style={{ color: "var(--text-muted)" }}
              >
                {t.home.logoutButton}
              </button>
            </form>
          </div>
        </div>
      </div>

      <SheetsSection sheets={sheets} createSheet={createSheet} />

      <ObjectsSection categories={categories} createCategory={createCategory} />

      {/* Bod 5: tlacidlo "Dnes" dole v strede - rovnaky "fixed bottom bar"
          vzor ako PDF/☰ na strankach sheetu/kategorie. */}
      <div className="bottom-bar">
        <DailyEntry sheets={dailyEntrySheets} submitDailyEntry={submitDailyEntry} />
      </div>
    </main>
  );
}

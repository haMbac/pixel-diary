import Link from "next/link";
import { getCurrentUser } from "@/lib/currentUser";
import { getLocale } from "@/lib/locale";
import { dictionary } from "@/i18n/dictionary";
import {
  updateAccountName,
  requestEmailChangeCode,
  verifyEmailChangeCode,
  deleteAccount,
} from "@/app/account-actions";
import { BackArrowIcon } from "../ui-icons";
import { AccountSettingsForm } from "./account-settings-form";

// Bod 2.2/2.3: stranka nastaveni uctu - meno, email (so znovaovarenim pri
// zmene), vymazanie uctu.
export default async function AccountPage() {
  const user = await getCurrentUser();
  const locale = await getLocale();
  const t = dictionary[locale];

  return (
    <main className="mx-auto p-4 sm:p-8 pb-24 w-full" style={{ maxWidth: "100vw" }}>
      <div className="section-width" style={{ marginLeft: "auto", marginRight: "auto" }}>
        <div className="flex items-center gap-2 mb-6">
          <Link
            href="/"
            aria-label={t.account.backToHome}
            title={t.account.backToHome}
            className="p-2 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--border-hover)] hover:text-[var(--ink)]"
          >
            <BackArrowIcon size={22} />
          </Link>
          <h1 className="text-2xl font-semibold">{t.account.heading}</h1>
        </div>
        <AccountSettingsForm
          name={user.name}
          email={user.email}
          updateAccountName={updateAccountName}
          requestEmailChangeCode={requestEmailChangeCode}
          verifyEmailChangeCode={verifyEmailChangeCode}
          deleteAccount={deleteAccount}
        />
      </div>
    </main>
  );
}

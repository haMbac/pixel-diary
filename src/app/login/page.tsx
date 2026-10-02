import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/session";
import { requestLoginCode, verifyLoginCode } from "@/app/auth-actions";
import { continueAsGuest } from "@/app/guest-actions";
import { LoginForm } from "./login-form";
import { getLocale } from "@/lib/locale";
import { dictionary } from "@/i18n/dictionary";

// Bod 1.1: prihlasovacia stranka. Ak uz P ma platnu session, nema zmysel
// mu ju znova ukazovat.
export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/");

  const locale = await getLocale();
  const t = dictionary[locale];

  return (
    <main className="mx-auto p-4 sm:p-8 w-full flex-1 flex items-center justify-center">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-center">{t.auth.appTitle}</h1>
        <p className="text-sm mb-8 text-center" style={{ color: "var(--text-muted)" }}>
          {t.auth.loginHeading}
        </p>
        <LoginForm requestLoginCode={requestLoginCode} verifyLoginCode={verifyLoginCode} />
        <div className="flex items-center gap-3 my-4" aria-hidden="true">
          <div className="flex-1 border-t" style={{ borderColor: "var(--border)" }} />
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>{t.auth.orDivider}</span>
          <div className="flex-1 border-t" style={{ borderColor: "var(--border)" }} />
        </div>
        <form action={continueAsGuest}>
          <button
            type="submit"
            className="w-full text-sm px-4 py-2 rounded border hover:bg-[var(--border-hover)]"
            style={{ borderColor: "var(--border)" }}
          >
            {t.auth.continueAsGuestButton}
          </button>
        </form>
        <p className="text-sm text-center mt-4" style={{ color: "var(--text-muted)" }}>
          {t.auth.noAccountText}{" "}
          <Link href="/signup" className="underline">
            {t.auth.signupLink}
          </Link>
          .
        </p>
      </div>
    </main>
  );
}

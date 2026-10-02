import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/session";
import { requestSignupCode, verifySignupCode } from "@/app/auth-actions";
import { SignupForm } from "./signup-form";
import { getLocale } from "@/lib/locale";
import { dictionary } from "@/i18n/dictionary";

// Bod 2.11/2.12: registracna stranka.
export default async function SignupPage() {
  const user = await getSessionUser();
  if (user) redirect("/");

  const locale = await getLocale();
  const t = dictionary[locale];

  return (
    <main className="mx-auto p-4 sm:p-8 w-full flex-1 flex items-center justify-center">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-center">{t.auth.appTitle}</h1>
        <p className="text-sm mb-8 text-center" style={{ color: "var(--text-muted)" }}>
          {t.auth.signupHeading}
        </p>
        <SignupForm requestSignupCode={requestSignupCode} verifySignupCode={verifySignupCode} />
        <p className="text-sm text-center mt-4" style={{ color: "var(--text-muted)" }}>
          {t.auth.haveAccountText}{" "}
          <Link href="/login" className="underline">
            {t.auth.loginLink}
          </Link>
          .
        </p>
      </div>
    </main>
  );
}

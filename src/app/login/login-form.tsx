"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { RequestCodeState, VerifyCodeState } from "@/app/auth-actions";
import { useT } from "@/i18n/context";

const RESEND_COOLDOWN_S = 30;

type RequestCodeAction = (
  prevState: RequestCodeState,
  formData: FormData
) => Promise<RequestCodeState>;
type VerifyCodeAction = (
  prevState: VerifyCodeState,
  formData: FormData
) => Promise<VerifyCodeState>;

// Bod 1.1: dvojkrokovy formular - najprv email ("Log in" posle kod),
// potom zadanie kodu ("resend code" / "back" na zmenu emailu). Oba kroky
// zdielaju ten isty "requestState.email", aby sa pri "resend" neposielal
// novy formular s emailom nanovo.
export function LoginForm({
  requestLoginCode,
  verifyLoginCode,
}: {
  requestLoginCode: RequestCodeAction;
  verifyLoginCode: VerifyCodeAction;
}) {
  const t = useT();
  const [requestState, requestAction, requestPending] = useActionState(requestLoginCode, {
    error: null,
    sent: false,
    email: "",
    // Predvolene zaskrtnute - zachovava doterajsie spravanie (kazde
    // prihlasenie uz doteraz vydrzalo 30 dni), odskrtnutie je volitelny
    // opt-out pre zdielany/verejny pocitac.
    remember: true,
  });
  const [verifyState, verifyAction, verifyPending] = useActionState(verifyLoginCode, {
    error: null,
  });

  const [cooldown, setCooldown] = useState(0);
  const codeInputRef = useRef<HTMLInputElement>(null);

  // Po uspesnom odoslani kodu (aj pri "resend") spusti odpocet, kym sa da
  // ziadat o dalsi.
  useEffect(() => {
    if (requestState.sent) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCooldown(RESEND_COOLDOWN_S);
    }
  }, [requestState]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // Nespravny kod = vycistit pole a fokusnut ho znova, nie presmerovat P
  // spat na zadavanie emailu (pozri poznamku pri verifyLoginCode).
  useEffect(() => {
    if (verifyState.error && codeInputRef.current) {
      codeInputRef.current.value = "";
      codeInputRef.current.focus();
    }
  }, [verifyState.error]);

  if (!requestState.sent) {
    return (
      <form action={requestAction} className="flex flex-col gap-3">
        <input
          type="email"
          name="email"
          placeholder={t.auth.emailPlaceholder}
          required
          autoFocus
          className="border rounded px-3 py-2"
          style={{ borderColor: "var(--border)" }}
        />
        <label className="flex items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
          <input type="checkbox" name="remember" defaultChecked />
          {t.auth.rememberMeLabel}
        </label>
        {requestState.error && (
          <p className="text-red-600 text-sm">{requestState.error}</p>
        )}
        <button
          type="submit"
          disabled={requestPending}
          className="bg-black text-white rounded px-4 py-2 disabled:opacity-50"
        >
          {requestPending ? t.auth.sendingButton : t.auth.loginButton}
        </button>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        {t.auth.codeSentInfo(requestState.email)}
      </p>
      <form action={verifyAction} className="flex flex-col gap-3">
        <input type="hidden" name="email" value={requestState.email} />
        {requestState.remember && <input type="hidden" name="remember" value="on" />}
        <input
          ref={codeInputRef}
          type="text"
          name="code"
          inputMode="numeric"
          maxLength={6}
          placeholder="123456"
          required
          autoFocus
          className="border rounded px-3 py-2 text-center tracking-[0.5em]"
          style={{ borderColor: "var(--border)" }}
        />
        {verifyState.error && <p className="text-red-600 text-sm">{verifyState.error}</p>}
        <button
          type="submit"
          disabled={verifyPending}
          className="bg-black text-white rounded px-4 py-2 disabled:opacity-50"
        >
          {verifyPending ? t.auth.verifyingButton : t.auth.verifyButton}
        </button>
      </form>
      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{ color: "var(--text-muted)" }}
          className="hover:underline"
        >
          {t.auth.backButton}
        </button>
        <form action={requestAction}>
          <input type="hidden" name="email" value={requestState.email} />
          {requestState.remember && <input type="hidden" name="remember" value="on" />}
          <button
            type="submit"
            disabled={cooldown > 0 || requestPending}
            style={{ color: "var(--text-muted)" }}
            className="hover:underline disabled:opacity-50 disabled:no-underline"
          >
            {cooldown > 0 ? t.auth.resendCooldown(cooldown) : t.auth.resendButton}
          </button>
        </form>
      </div>
    </div>
  );
}

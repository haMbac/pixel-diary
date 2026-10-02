"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useT } from "@/i18n/context";
import type {
  UpdateNameState,
  RequestEmailChangeState,
  VerifyEmailChangeState,
} from "@/app/account-actions";

const RESEND_COOLDOWN_S = 30;

type UpdateNameAction = (
  prevState: UpdateNameState,
  formData: FormData
) => Promise<UpdateNameState>;
type RequestEmailChangeAction = (
  prevState: RequestEmailChangeState,
  formData: FormData
) => Promise<RequestEmailChangeState>;
type VerifyEmailChangeAction = (
  prevState: VerifyEmailChangeState,
  formData: FormData
) => Promise<VerifyEmailChangeState>;

export function AccountSettingsForm({
  name,
  email,
  updateAccountName,
  requestEmailChangeCode,
  verifyEmailChangeCode,
  deleteAccount,
}: {
  name: string;
  email: string | null;
  updateAccountName: UpdateNameAction;
  requestEmailChangeCode: RequestEmailChangeAction;
  verifyEmailChangeCode: VerifyEmailChangeAction;
  deleteAccount: () => Promise<void>;
}) {
  return (
    <div className="flex flex-col gap-8 max-w-sm">
      <NameSection name={name} updateAccountName={updateAccountName} />
      <EmailSection
        email={email}
        requestEmailChangeCode={requestEmailChangeCode}
        verifyEmailChangeCode={verifyEmailChangeCode}
      />
      <DeleteSection deleteAccount={deleteAccount} />
    </div>
  );
}

// Bod 2.2: premenovanie - okamzite ulozenie (bez samostatneho edit rezimu),
// rovnaky vzor ako inde v appke (nazov sheetu/kategorie).
function NameSection({
  name,
  updateAccountName,
}: {
  name: string;
  updateAccountName: UpdateNameAction;
}) {
  const t = useT();
  const [state, formAction, isPending] = useActionState(updateAccountName, { error: null });

  return (
    <section>
      <h3 className="text-lg font-medium mb-2">{t.account.nameHeading}</h3>
      <form action={formAction} className="flex gap-2 items-center">
        <input
          type="text"
          name="name"
          defaultValue={name}
          required
          className="flex-1 border-b px-1 py-1 bg-transparent focus:outline-none"
          style={{ borderColor: "var(--border)" }}
        />
        <button
          type="submit"
          disabled={isPending}
          className="text-sm px-3 py-1 rounded border disabled:opacity-50"
          style={{ borderColor: "var(--border)" }}
        >
          {isPending ? t.account.savingButton : t.account.saveButton}
        </button>
      </form>
      {state.error && <p className="text-red-600 text-sm mt-1">{state.error}</p>}
    </section>
  );
}

// Bod 2.2: zmena emailu - vyzaduje overenie NOVEHO emailu (rovnaky
// dvojkrokovy kod ako login/signup - pozri LoginForm pre komentare k
// resend/wrong-code spravaniu, tu identicke).
function EmailSection({
  email,
  requestEmailChangeCode,
  verifyEmailChangeCode,
}: {
  email: string | null;
  requestEmailChangeCode: RequestEmailChangeAction;
  verifyEmailChangeCode: VerifyEmailChangeAction;
}) {
  const t = useT();
  const [changing, setChanging] = useState(false);
  const [requestState, requestAction, requestPending] = useActionState(requestEmailChangeCode, {
    error: null,
    sent: false,
    email: "",
  });
  const [verifyState, verifyAction, verifyPending] = useActionState(verifyEmailChangeCode, {
    error: null,
  });
  const [cooldown, setCooldown] = useState(0);
  const codeInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (verifyState.error && codeInputRef.current) {
      codeInputRef.current.value = "";
      codeInputRef.current.focus();
    }
  }, [verifyState.error]);

  return (
    <section>
      <h3 className="text-lg font-medium mb-2">{t.account.emailHeading}</h3>
      {!changing ? (
        email ? (
          <div className="flex items-center justify-between gap-2">
            <p>{email}</p>
            <button
              type="button"
              onClick={() => setChanging(true)}
              className="text-sm px-3 py-1 rounded border"
              style={{ borderColor: "var(--border)" }}
            >
              {t.account.changeEmailButton}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <p style={{ color: "var(--text-muted)" }}>
              {t.account.noEmailSetMessage} {t.account.addEmailHint}
            </p>
            <button
              type="button"
              onClick={() => setChanging(true)}
              className="text-sm px-3 py-1 rounded border self-start"
              style={{ borderColor: "var(--border)" }}
            >
              {t.account.addEmailButton}
            </button>
          </div>
        )
      ) : !requestState.sent ? (
        <form action={requestAction} className="flex flex-col gap-2">
          <div className="flex gap-2 items-center">
            <input
              type="email"
              name="email"
              placeholder={t.account.newEmailPlaceholder}
              required
              autoFocus
              className="flex-1 border-b px-1 py-1 bg-transparent focus:outline-none"
              style={{ borderColor: "var(--border)" }}
            />
            <button
              type="submit"
              disabled={requestPending}
              className="text-sm px-3 py-1 rounded border disabled:opacity-50"
              style={{ borderColor: "var(--border)" }}
            >
              {requestPending ? t.account.sendingButton : t.account.sendCodeButton}
            </button>
          </div>
          {requestState.error && <p className="text-red-600 text-sm">{requestState.error}</p>}
          <button
            type="button"
            onClick={() => setChanging(false)}
            className="text-sm text-left"
            style={{ color: "var(--text-muted)" }}
          >
            {t.account.cancelButton}
          </button>
        </form>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {t.account.codeSentPrefix}
            <strong>{requestState.email}</strong>
            {t.account.codeSentSuffix}
          </p>
          <form action={verifyAction} className="flex gap-2 items-center">
            <input type="hidden" name="email" value={requestState.email} />
            <input
              ref={codeInputRef}
              type="text"
              name="code"
              inputMode="numeric"
              maxLength={6}
              placeholder={t.account.codePlaceholder}
              required
              autoFocus
              className="border rounded px-3 py-2 text-center tracking-[0.5em]"
              style={{ borderColor: "var(--border)" }}
            />
            <button
              type="submit"
              disabled={verifyPending}
              className="text-sm px-3 py-1 rounded border disabled:opacity-50"
              style={{ borderColor: "var(--border)" }}
            >
              {verifyPending ? t.account.verifyingButton : t.account.verifyButton}
            </button>
          </form>
          {verifyState.error && <p className="text-red-600 text-sm">{verifyState.error}</p>}
          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => setChanging(false)}
              style={{ color: "var(--text-muted)" }}
              className="hover:underline"
            >
              {t.account.cancelButton}
            </button>
            <form action={requestAction}>
              <input type="hidden" name="email" value={requestState.email} />
              <button
                type="submit"
                disabled={cooldown > 0 || requestPending}
                style={{ color: "var(--text-muted)" }}
                className="hover:underline disabled:opacity-50 disabled:no-underline"
              >
                {cooldown > 0 ? t.account.resendButtonCooldown(cooldown) : t.account.resendButton}
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

// Bod 2.3: vymazanie uctu - potvrdenie s upozornenim na dosledky
// (vymazu sa aj vsetky sheety/kategorie), presne podla specifikacie
// ("S overí túto voľbu... uopzornením na dôsledky"). "deleteAccount" uz
// sama v sebe presmeruje na /login (redirect() vo vnutri Server Action),
// preto tu netreba ziadnu dalsiu navigaciu po jej dokonceni.
function DeleteSection({ deleteAccount }: { deleteAccount: () => Promise<void> }) {
  const t = useT();
  const [deleting, startTransition] = useTransition();

  return (
    <section>
      <h3 className="text-lg font-medium mb-2">{t.account.deleteAccountHeading}</h3>
      <button
        type="button"
        disabled={deleting}
        onClick={() => {
          if (!window.confirm(t.account.deleteConfirmMessage)) {
            return;
          }
          startTransition(() => {
            deleteAccount();
          });
        }}
        className="text-red-600 text-sm hover:underline disabled:opacity-50"
      >
        {deleting ? t.account.deletingButton : t.account.deleteAccountButton}
      </button>
    </section>
  );
}

"use client";

import { useActionState } from "react";
import styles from "./login.module.css";
import {
  requestLoginCodeAction,
  verifyLoginCodeAction,
} from "@/app/auth-actions";
import {
  initialRequestLoginCodeState,
  initialVerifyLoginCodeState,
} from "@/app/auth-form-state";

type LoginFormProps = {
  nextPath: string;
};

export function LoginForm({ nextPath }: LoginFormProps) {
  const [requestState, requestAction, requestPending] = useActionState(
    requestLoginCodeAction,
    {
      ...initialRequestLoginCodeState,
      nextPath,
    },
  );
  const [verifyState, verifyAction, verifyPending] = useActionState(
    verifyLoginCodeAction,
    initialVerifyLoginCodeState,
  );

  const email = requestState.email;
  const displayName = requestState.displayName;
  const canVerify = requestState.status === "code-sent" && email.length > 0;

  return (
    <div className={styles.grid}>
      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <p className={styles.eyebrow}>Anmeldung</p>
          <h2>Mit E-Mail-Code einloggen</h2>
          <p>
            Gib Deine E-Mail-Adresse ein. Wir schicken Dir einen einmaligen Code, mit dem Du Dich
            auf diesem Gerät anmeldest.
          </p>
        </div>

        <form action={requestAction} className={styles.form}>
          <input name="nextPath" type="hidden" value={nextPath} />

          <div className={styles.field}>
            <label htmlFor="email">E-Mail-Adresse</label>
            <input
              defaultValue={requestState.email}
              id="email"
              name="email"
              placeholder="du@beispiel.de"
              required
              type="email"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="displayName">Name für die App</label>
            <input
              defaultValue={requestState.displayName}
              id="displayName"
              name="displayName"
              placeholder="Optional, zum Beispiel Lui"
              type="text"
            />
          </div>

          {requestState.status === "error" ? (
            <p className={styles.statusError}>{requestState.message}</p>
          ) : null}

          {requestState.status === "code-sent" ? (
            <p className={styles.statusSuccess}>{requestState.message}</p>
          ) : null}

          <button className={styles.submitButton} disabled={requestPending} type="submit">
            {requestPending ? "Code wird gesendet ..." : "Code anfordern"}
          </button>
        </form>

        {requestState.debugCode ? (
          <p className={styles.debugCode}>
            Entwicklungsmodus: Dein Testcode lautet <strong>{requestState.debugCode}</strong>.
          </p>
        ) : null}
      </section>

      <aside className={styles.sideCard}>
        <div className={styles.cardHeader}>
          <p className={styles.eyebrow}>Bestätigung</p>
          <h2>Code eingeben</h2>
          <p>
            Der Code ist 15 Minuten gültig. Wenn Du Dich auf Handy und Tablet anmeldest, entsteht
            auf jedem Gerät eine eigene Session.
          </p>
        </div>

        <form action={verifyAction} className={styles.form}>
          <input name="nextPath" type="hidden" value={canVerify ? requestState.nextPath : nextPath} />
          <input name="email" type="hidden" value={email} />
          <input name="displayName" type="hidden" value={displayName} />

          <div className={styles.field}>
            <label htmlFor="code">Anmeldecode</label>
            <input
              autoComplete="one-time-code"
              disabled={!canVerify}
              id="code"
              inputMode="numeric"
              name="code"
              pattern="[0-9]{6}"
              placeholder="123456"
              required
              type="text"
            />
          </div>

          <p className={styles.hint}>
            {canVerify
              ? `Code für ${email}`
              : "Fordere zuerst oben Deinen Code an. Danach kannst Du ihn hier bestätigen."}
          </p>

          {verifyState.status === "error" ? (
            <p className={styles.statusError}>{verifyState.message}</p>
          ) : null}

          <button className={styles.submitButton} disabled={!canVerify || verifyPending} type="submit">
            {verifyPending ? "Wird geprüft ..." : "Anmeldung bestätigen"}
          </button>
        </form>

        <ul>
          <li>Browser- oder Gerätewechsel sind unkritisch. Du meldest Dich dort einfach erneut an.</li>
          <li>Wenn Cookies gelöscht werden, gehen nur die Sessions auf diesem Gerät verloren.</li>
          <li>Deine persönlichen Pläne und Einstellungen bleiben serverseitig erhalten.</li>
        </ul>
      </aside>
    </div>
  );
}

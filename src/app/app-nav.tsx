"use client";

import Link from "next/link";
import styles from "./app-nav.module.css";

export type AppNavUser = {
  email: string;
  displayName: string | null;
};

type AppNavProps = {
  currentPath: "/" | "/rezepte" | "/einkaufsliste" | "/einstellungen";
  user: AppNavUser;
};

function labelForUser(user: AppNavUser) {
  return user.displayName?.trim() || user.email;
}

export function AppNav({ currentPath, user }: AppNavProps) {
  return (
    <nav className={styles.nav}>
      <div className={styles.links}>
        <Link aria-current={currentPath === "/" ? "page" : undefined} href="/">
          Dashboard
        </Link>
        <Link aria-current={currentPath === "/rezepte" ? "page" : undefined} href="/rezepte">
          Rezepte
        </Link>
        <Link
          aria-current={currentPath === "/einkaufsliste" ? "page" : undefined}
          href="/einkaufsliste"
        >
          Einkaufsliste
        </Link>
        <Link
          aria-current={currentPath === "/einstellungen" ? "page" : undefined}
          href="/einstellungen"
        >
          Einstellungen
        </Link>
      </div>

      <div className={styles.account}>
        <div className={styles.accountMeta}>
          <strong>{labelForUser(user)}</strong>
          <span>{user.email}</span>
        </div>

        <Link className={styles.logoutLink} href="/abmelden">
          Abmelden
        </Link>
      </div>
    </nav>
  );
}

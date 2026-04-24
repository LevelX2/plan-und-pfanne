"use client";

import Link from "next/link";
import styles from "./app-nav.module.css";

type AppNavProps = {
  currentPath: string;
}

export function AppNav({ currentPath }: AppNavProps) {
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
    </nav>
  );
}

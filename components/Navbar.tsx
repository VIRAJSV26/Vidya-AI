"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { Button, Icon, PATHS } from "./ui";

interface NavbarProps {
  /** Show condensed variant on workspace screens */
  compact?: boolean;
}

export default function Navbar(_props: NavbarProps) {
  const pathname = usePathname();
  const { uploads, openEmail, activeDoc } = useApp();

  const linkCls = (href: string) =>
    `text-sm font-medium px-3 py-2 rounded-lg transition-colors ${
      pathname === href
        ? "text-spruce-700 dark:text-spruce-200 bg-spruce-50 dark:bg-stone-800"
        : "text-ink-soft dark:text-stone-300 hover:text-ink dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800"
    }`;

  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-cream/85 dark:bg-stone-950/85 border-b border-stone-200/70 dark:border-stone-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <span className="w-9 h-9 rounded-xl bg-spruce-600 text-white grid place-items-center font-serif text-xl leading-none shadow-sm">
            वि
          </span>
          <span className="leading-tight">
            <span className="block font-serif font-semibold text-[19px] tracking-tight">Vidya</span>
            <span className="hidden sm:block text-[11px] text-ink-soft dark:text-stone-400 -mt-0.5">
              AI academic companion
            </span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <Link href="/" className={linkCls("/")}>Home</Link>
          <Link href="/upload" className={linkCls("/upload")}>Upload</Link>
          <Link href="/workspace?mode=code" className={linkCls("/workspace")}>Workspace</Link>
        </nav>

        <div className="flex items-center gap-2">
          {uploads.length > 0 && (
            <span className="hidden lg:inline-flex text-xs text-ink-soft dark:text-stone-400 border border-stone-200 dark:border-stone-700 rounded-full px-3 py-1.5 bg-white/60 dark:bg-stone-900">
              {uploads.length} file{uploads.length > 1 ? "s" : ""} this session
            </span>
          )}
          <ThemeToggle />
          <Button
            variant="secondary"
            size="sm"
            className="hidden sm:inline-flex"
            onClick={() =>
              openEmail({
                mode: activeDoc?.mode ?? "code",
                docName: activeDoc?.name ?? "study-summary",
              })
            }
          >
            <Icon d={PATHS.mail} className="w-4 h-4" />
            Email me this
          </Button>
          <Link href="/upload">
            <Button size="sm">
              <Icon d={PATHS.upload} className="w-4 h-4" />
              <span className="hidden sm:inline">Upload</span>
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

export function ThemeToggle() {
  const { theme, toggleTheme } = useApp();
  return (
    <button
      onClick={toggleTheme}
      aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
      title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
      className="w-9 h-9 grid place-items-center rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-ink-soft dark:text-stone-300 hover:text-ink dark:hover:text-white hover:border-spruce-300 transition-colors"
    >
      <Icon d={theme === "light" ? PATHS.moon : PATHS.sun} className="w-[18px] h-[18px]" />
    </button>
  );
}

"use client";

import Link from "next/link";
import { useT } from "@/i18n/provider";

export default function Footer() {
  const { t } = useT();

  return (
    <footer className="border-t border-zinc-800 bg-zinc-950">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-5 px-4 py-8 sm:flex-row sm:justify-between sm:px-6">
        <Link
          href="/"
          className="text-sm font-bold tracking-widest text-white transition-colors hover:text-[#00f3ff]"
        >
          SMAR<span className="text-[#00f3ff]">TOK</span>
        </Link>

        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-zinc-400">
          <Link href="/privacy" className="transition-colors hover:text-[#00f3ff]">
            {t("legal.privacy")}
          </Link>
          <Link href="/terms" className="transition-colors hover:text-[#00f3ff]">
            {t("legal.terms")}
          </Link>
          <a
            href="https://support.smartok.app"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-[#00f3ff]"
          >
            {t("nav.support")}
          </a>
        </nav>

        <p className="text-xs text-zinc-600">
          © {new Date().getFullYear()} SmarTok
        </p>
      </div>
    </footer>
  );
}

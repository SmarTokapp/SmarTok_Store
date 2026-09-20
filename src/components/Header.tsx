"use client";

import Link from "next/link";
import { useCart } from "@/store/cart";
import { useT } from "@/i18n/provider";

export default function Header() {
  const { count, openCart } = useCart();
  const { t } = useT();

  return (
    <header className="sticky top-0 z-40">
      {/* Announcement banner */}
      <div className="bg-[#00f3ff] px-4 py-2 text-center text-xs font-semibold text-black sm:text-sm">
        {t("announcement")}
      </div>

      {/* Main bar — 3-column grid keeps the nav optically centered
          regardless of logo/cart widths */}
      <div className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
        <div className="mx-auto grid h-14 max-w-5xl grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-6">
          {/* Logo */}
          <Link
            href="/"
            className="justify-self-start text-lg font-bold tracking-widest text-white transition-colors hover:text-[#00f3ff]"
          >
            SMAR<span className="text-[#00f3ff]">TOK</span>
          </Link>

          {/* Nav — centered */}
          <nav className="flex items-center gap-8 text-sm font-medium text-zinc-400">
            <Link
              href="/"
              className="transition-colors hover:text-[#00f3ff]"
            >
              {t("nav.home")}
            </Link>
          </nav>

          {/* Cart button */}
          <button
            type="button"
            onClick={openCart}
            aria-label={t("cart.title")}
            className="relative flex h-10 w-10 items-center justify-center justify-self-end rounded-full border border-zinc-700 text-zinc-300 transition-colors hover:border-[#00f3ff] hover:text-[#00f3ff]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z"
              />
            </svg>
            {count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#00f3ff] px-1 text-[11px] font-bold text-black">
                {count > 99 ? "99+" : count}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

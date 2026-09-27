"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/store/cart";
import { useFavorites } from "@/store/favorites";
import { useAuth } from "@/store/auth";
import { useT } from "@/i18n/provider";
import UserMenu from "@/components/UserMenu";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function Header() {
  const { count, openCart } = useCart();
  const { favorites, openFavorites } = useFavorites();
  const { user } = useAuth();
  const { t } = useT();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40">
      {/* Announcement banner */}
      <div className="bg-[#00f3ff] px-4 py-2 text-center text-xs font-semibold text-black sm:text-sm">
        {t("announcement")}
      </div>

      {/* Main bar — 3-column grid keeps the nav optically centered
          regardless of logo/cart widths */}
      <div className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
        <div className="mx-auto grid h-14 max-w-5xl grid-cols-[auto_1fr_auto] items-center gap-3 px-3 sm:px-6">
          {/* Logo — shrink-0 so the 3-col grid never squishes it */}
          <Link
            href="/"
            className="shrink-0 text-base font-bold tracking-widest text-white transition-colors hover:text-[#00f3ff] sm:text-lg"
          >
            SMAR<span className="text-[#00f3ff]">TOK</span>
          </Link>

          {/* Nav — centered in the flexible middle column.
              Desktop only: on mobile the links live in the hamburger menu. */}
          <nav className="hidden min-w-0 items-center justify-center gap-6 text-sm font-medium text-zinc-400 md:flex">
            <Link
              href="/"
              className="whitespace-nowrap transition-colors hover:text-[#00f3ff]"
            >
              {t("nav.home")}
            </Link>
            <a
              href="https://smartok.app"
              target="_blank"
              rel="noopener noreferrer"
              className="whitespace-nowrap transition-colors hover:text-[#00f3ff]"
            >
              {t("nav.website")}
            </a>
            <a
              href="https://support.smartok.app"
              target="_blank"
              rel="noopener noreferrer"
              className="whitespace-nowrap transition-colors hover:text-[#00f3ff]"
            >
              {t("nav.support")}
            </a>
          </nav>

          {/* Right cluster — favorites (logged-in only), cart, auth */}
          <div className="flex items-center gap-2 justify-self-end">
            {user && (
              <button
                type="button"
                onClick={openFavorites}
                aria-label={t("favorites.title")}
                className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-700 text-zinc-300 transition-colors hover:border-red-400 hover:text-red-400"
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
                    d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
                  />
                </svg>
                {favorites.length > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">
                    {favorites.length > 99 ? "99+" : favorites.length}
                  </span>
                )}
              </button>
            )}

            {/* Cart button — fixed 40px target, never squishes */}
            <button
              type="button"
              onClick={openCart}
              aria-label={t("cart.title")}
              className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-700 text-zinc-300 transition-colors hover:border-[#00f3ff] hover:text-[#00f3ff]"
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

            {/* Auth + language — desktop only; mobile moves them into
                the hamburger dropdown below */}
            <div className="hidden items-center gap-2 md:flex">
              <UserMenu />
              <LanguageSwitcher />
            </div>

            {/* Hamburger — mobile only */}
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label={t("nav.menu")}
              aria-expanded={menuOpen}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-700 text-zinc-300 transition-colors hover:border-[#00f3ff] hover:text-[#00f3ff] md:hidden"
            >
              {menuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile dropdown — Website/Support/Login/Language that don't fit
            the compact top bar. Desktop is unaffected. */}
        {menuOpen && (
          <div className="border-t border-zinc-800 md:hidden">
            <div className="mx-auto flex max-w-5xl flex-col px-3 pb-3 pt-1 sm:px-6">
              <Link
                href="/"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-3 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-[#00f3ff]"
              >
                {t("nav.home")}
              </Link>
              <a
                href="https://smartok.app"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-3 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-[#00f3ff]"
              >
                {t("nav.website")}
              </a>
              <a
                href="https://support.smartok.app"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-3 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-[#00f3ff]"
              >
                {t("nav.support")}
              </a>
              <div className="mt-1 flex items-center gap-2 border-t border-zinc-800 px-3 pt-3">
                <UserMenu />
                <LanguageSwitcher />
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

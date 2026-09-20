"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useCart } from "@/store/cart";
import { useT } from "@/i18n/provider";

export default function SuccessPage() {
  const { clear } = useCart();
  const { t } = useT();

  // Order completed — empty the persisted cart once
  useEffect(() => {
    clear();
  }, [clear]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-24 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#00f3ff]/10 blur-3xl"
      />
      <div className="relative flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#00f3ff] bg-[#00f3ff]/10">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#00f3ff"
          strokeWidth={2.5}
          className="h-8 w-8"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m4.5 12.75 6 6 9-13.5"
          />
        </svg>
      </div>

      <h1 className="relative text-3xl font-bold tracking-tight text-white sm:text-4xl">
        {t("success.title")}
      </h1>
      <p className="relative max-w-md text-sm leading-6 text-zinc-400 sm:text-base">
        {t("success.body")}
      </p>
      <Link
        href="/"
        className="relative rounded-xl bg-[#00f3ff] px-8 py-3.5 text-sm font-bold uppercase tracking-wider text-black transition-all hover:shadow-[0_0_24px_rgba(0,243,255,0.4)]"
      >
        {t("success.continue")}
      </Link>
    </div>
  );
}

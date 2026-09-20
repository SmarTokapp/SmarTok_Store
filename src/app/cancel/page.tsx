"use client";

import Link from "next/link";
import { useT } from "@/i18n/provider";

export default function CancelPage() {
  const { t } = useT();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-24 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-zinc-700 bg-zinc-900">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="h-8 w-8 text-zinc-500"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18 18 6M6 6l12 12"
          />
        </svg>
      </div>

      <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
        {t("cancel.title")}
      </h1>
      <p className="max-w-md text-sm leading-6 text-zinc-400 sm:text-base">
        {t("cancel.body")}
      </p>
      <Link
        href="/"
        className="rounded-xl border border-[#00f3ff] px-8 py-3.5 text-sm font-bold uppercase tracking-wider text-[#00f3ff] transition-colors hover:bg-[#00f3ff]/10"
      >
        {t("cancel.backToShop")}
      </Link>
    </div>
  );
}

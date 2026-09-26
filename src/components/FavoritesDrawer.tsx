"use client";

import Link from "next/link";
import Image from "next/image";
import { useFavorites } from "@/store/favorites";
import { useT } from "@/i18n/provider";
import { formatPrice } from "@/utils/format";

export default function FavoritesDrawer() {
  const { favorites, isOpen, closeFavorites, removeFavorite } = useFavorites();
  const { t } = useT();

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={closeFavorites}
        aria-hidden
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Panel */}
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-[85vw] max-w-md flex-col border-l border-zinc-800 bg-zinc-950 shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <h2 className="text-lg font-bold text-white">{t("favorites.title")}</h2>
          <button
            type="button"
            onClick={closeFavorites}
            aria-label={t("common.close")}
            className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-[#00f3ff]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {favorites.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <p className="text-base font-medium text-zinc-300">
                {t("favorites.empty")}
              </p>
              <p className="max-w-xs text-sm text-zinc-500">
                {t("favorites.emptyHint")}
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-4">
              {favorites.map((item) => (
                <li
                  key={item.id}
                  className="flex gap-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3"
                >
                  <Link
                    href={`/product/${item.id}`}
                    onClick={closeFavorites}
                    className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-zinc-800"
                  >
                    {item.image && (
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    )}
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <Link
                      href={`/product/${item.id}`}
                      onClick={closeFavorites}
                      className="line-clamp-2 text-sm font-semibold text-white transition-colors hover:text-[#00f3ff]"
                    >
                      {item.title}
                    </Link>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <span className="text-sm font-bold text-[#00f3ff]">
                        {item.price !== null ? formatPrice(item.price) : "—"}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeFavorite(item.id)}
                    aria-label={t("favorites.remove")}
                    className="flex h-10 w-10 shrink-0 items-center justify-center self-start rounded-lg text-zinc-600 transition-colors hover:bg-zinc-800 hover:text-red-400"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.108 48.108 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </>
  );
}

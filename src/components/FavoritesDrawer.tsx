"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useFavorites, type FavoriteItem } from "@/store/favorites";
import { useCart } from "@/store/cart";
import { useT } from "@/i18n/provider";
import { formatPrice } from "@/utils/format";

export default function FavoritesDrawer() {
  const { favorites, isOpen, closeFavorites, removeFavorite } = useFavorites();
  const { addItem, openCart } = useCart();
  const { t } = useT();
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [addingAll, setAddingAll] = useState(false);

  /**
   * Older favorites may lack variant info — resolve the product's default
   * variant via the server (Printify token never reaches the client).
   */
  const resolveVariant = async (item: FavoriteItem) => {
    if (item.variantId && item.price !== null) {
      return {
        variantId: item.variantId,
        variantLabel: item.variantLabel ?? "",
        price: item.price,
      };
    }
    try {
      const res = await fetch(`/api/products/${item.id}/variant`);
      if (!res.ok) return null;
      const data = (await res.json()) as {
        variantId?: number;
        variantLabel?: string;
        price?: number;
      };
      if (!data.variantId || data.price === undefined) return null;
      return {
        variantId: data.variantId,
        variantLabel: data.variantLabel ?? "",
        price: data.price,
      };
    } catch {
      return null;
    }
  };

  const addToCart = async (item: FavoriteItem): Promise<boolean> => {
    const variant = await resolveVariant(item);
    if (!variant) return false;
    addItem(
      {
        productId: item.id,
        variantId: variant.variantId,
        title: item.title,
        image: item.image,
        price: variant.price,
        quantity: 1,
        variantLabel: variant.variantLabel,
      },
      { openCart: false }
    );
    return true;
  };

  const handleAdd = async (item: FavoriteItem) => {
    if (await addToCart(item)) {
      setAddedIds((prev) => new Set(prev).add(item.id));
      setTimeout(() => {
        setAddedIds((prev) => {
          const next = new Set(prev);
          next.delete(item.id);
          return next;
        });
      }, 2000);
    }
  };

  const handleAddAll = async () => {
    if (addingAll || favorites.length === 0) return;
    setAddingAll(true);
    let anyAdded = false;
    for (const item of favorites) {
      if (await addToCart(item)) anyAdded = true;
    }
    setAddingAll(false);
    if (anyAdded) {
      closeFavorites();
      openCart();
    }
  };

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
                    {item.variantLabel && (
                      <p className="mt-0.5 truncate text-xs text-zinc-500">
                        {item.variantLabel}
                      </p>
                    )}
                    <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                      <span className="text-sm font-bold text-[#00f3ff]">
                        {item.price !== null ? formatPrice(item.price) : "—"}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAdd(item)}
                        disabled={addedIds.has(item.id)}
                        className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
                          addedIds.has(item.id)
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-[#00f3ff]/10 text-[#00f3ff] hover:bg-[#00f3ff]/20"
                        }`}
                      >
                        {addedIds.has(item.id)
                          ? `✓ ${t("product.addedToCart")}`
                          : t("favorites.addToCart")}
                      </button>
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

        {favorites.length > 0 && (
          <div className="border-t border-zinc-800 px-6 py-4">
            <button
              type="button"
              onClick={handleAddAll}
              disabled={addingAll}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#00f3ff] px-5 py-3 text-sm font-bold text-black transition-all hover:shadow-[0_0_20px_rgba(0,243,255,0.4)] disabled:cursor-wait disabled:opacity-70"
            >
              {addingAll && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
              )}
              {addingAll
                ? t("cart.processing")
                : t("favorites.addAllToCart")}
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

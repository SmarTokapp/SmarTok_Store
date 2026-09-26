"use client";

import { useFavorites, type FavoriteItem } from "@/store/favorites";
import { useT } from "@/i18n/provider";

export default function FavoriteButton({ item }: { item: FavoriteItem }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { t } = useT();
  const active = isFavorite(item.id);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(item);
      }}
      aria-label={active ? t("favorites.remove") : t("favorites.add")}
      aria-pressed={active}
      className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/60 backdrop-blur-sm transition-all hover:scale-110 hover:border-[#00f3ff]/60"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        className={`h-5 w-5 transition-colors ${
          active ? "text-red-500" : "text-zinc-300"
        }`}
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={1.8}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
        />
      </svg>
    </button>
  );
}

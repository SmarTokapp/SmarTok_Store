"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  getPrimaryImage,
  getMinPrice,
  type PrintifyProduct,
  type PrintifyVariant,
} from "@/services/printify";
import { useCart } from "@/store/cart";
import { useT } from "@/i18n/provider";
import { formatPrice } from "@/utils/format";

export default function ProductView({ product }: { product: PrintifyProduct }) {
  const { addItem } = useCart();
  const { t } = useT();

  const options = useMemo(() => product.options ?? [], [product.options]);
  const images = useMemo(() => product.images ?? [], [product.images]);

  // Selected option values: optionIndex -> valueId (defaults to first value)
  const [selection, setSelection] = useState<Record<number, number>>(() => {
    const init: Record<number, number> = {};
    options.forEach((opt, i) => {
      if (opt.values?.length) init[i] = opt.values[0].id;
    });
    return init;
  });

  // Manual thumbnail pick — null means "auto" (variant mockup / default).
  // Reset to null whenever an option changes so color selection jumps to
  // the matching variant mockup again.
  const [manualIndex, setManualIndex] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const selectedIds = Object.values(selection);

  // Variant matching: Printify variants carry the chosen option-value ids
  // in `variant.options` — match on set equality.
  const matchedVariant: PrintifyVariant | undefined = useMemo(() => {
    return (product.variants ?? []).find(
      (v) =>
        v.is_enabled &&
        v.options?.length === selectedIds.length &&
        v.options.every((id) => selectedIds.includes(id))
    );
  }, [product.variants, selectedIds]);

  const inStock =
    !!matchedVariant && matchedVariant.is_available !== false;

  const price = matchedVariant?.price ?? getMinPrice(product);

  // Image resolution order: manual thumbnail pick → variant mockup →
  // Printify's default image → first image.
  const activeIndex = useMemo(() => {
    if (manualIndex !== null && images[manualIndex]) return manualIndex;
    if (matchedVariant) {
      const idx = images.findIndex((img) =>
        img.variant_ids?.includes(matchedVariant.id)
      );
      if (idx >= 0) return idx;
    }
    const def = images.findIndex((img) => img.is_default);
    return def >= 0 ? def : 0;
  }, [manualIndex, matchedVariant, images]);

  const activeImage = images[activeIndex]?.src ?? getPrimaryImage(product);

  const variantLabel = options
    .map((opt, i) => {
      const value = opt.values?.find((v) => v.id === selection[i]);
      return value?.title;
    })
    .filter(Boolean)
    .join(" / ");

  const handleSelect = (optionIndex: number, valueId: number) => {
    setSelection((prev) => ({ ...prev, [optionIndex]: valueId }));
    setManualIndex(null); // back to auto so the variant mockup takes over
  };

  const addToCart = () => {
    if (!matchedVariant || price === null) return;
    addItem({
      productId: product.id,
      variantId: matchedVariant.id,
      title: product.title,
      image: activeImage,
      price,
      quantity,
      variantLabel,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-8 overflow-x-hidden px-4 py-8 sm:gap-10 sm:px-6 sm:py-10 lg:grid-cols-2">
      {/* ── Gallery — min-w-0 lets the grid column shrink below content width ── */}
      <div className="flex min-w-0 flex-col gap-4">
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
          {activeImage ? (
            <Image
              src={activeImage}
              alt={product.title}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-zinc-700">
              No image
            </div>
          )}
        </div>

        {images.length > 1 && (
          <div className="flex w-full max-w-full gap-3 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch]">
            {images.map((img, i) => (
              <button
                key={`${img.src}-${i}`}
                type="button"
                onClick={() => setManualIndex(i)}
                className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border transition-all ${
                  activeIndex === i
                    ? "border-[#00f3ff] ring-1 ring-[#00f3ff]/50"
                    : "border-zinc-800 hover:border-zinc-600"
                }`}
              >
                <Image
                  src={img.src}
                  alt={`${product.title} view ${i + 1}`}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Details — min-w-0 lets the grid column shrink below content width ── */}
      <div className="flex min-w-0 flex-col gap-6">
        <div>
          <h1 className="break-words text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {product.title}
          </h1>
          <p className="mt-3 text-2xl font-bold text-[#00f3ff]">
            {price !== null ? formatPrice(price) : "—"}
          </p>
        </div>

        {/* Option selectors */}
        {options.map((opt, i) => (
          <div key={`${opt.name}-${i}`}>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">
              {t("product.selectOption", { name: opt.name })}
            </p>
            <div className="flex flex-wrap gap-2">
              {(opt.values ?? []).map((value) => {
                const isSelected = selection[i] === value.id;
                const isColor =
                  opt.type === "color" && value.colors?.length;

                if (isColor) {
                  return (
                    <button
                      key={value.id}
                      type="button"
                      onClick={() => handleSelect(i, value.id)}
                      title={value.title}
                      className={`h-12 w-12 rounded-full border-2 transition-all ${
                        isSelected
                          ? "scale-110 border-[#00f3ff] ring-2 ring-[#00f3ff]/40"
                          : "border-zinc-700 hover:border-zinc-500"
                      }`}
                      style={{ backgroundColor: value.colors![0] }}
                    />
                  );
                }

                return (
                  <button
                    key={value.id}
                    type="button"
                    onClick={() => handleSelect(i, value.id)}
                    className={`flex min-h-11 items-center rounded-lg border px-4 py-2.5 text-sm font-semibold transition-all ${
                      isSelected
                        ? "border-[#00f3ff] bg-[#00f3ff]/10 text-[#00f3ff]"
                        : "border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white"
                    }`}
                  >
                    {value.title}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Quantity */}
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">
            {t("product.quantity")}
          </p>
          <div className="inline-flex items-center rounded-lg border border-zinc-700">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="flex h-12 w-12 items-center justify-center text-xl text-zinc-400 transition-colors hover:text-[#00f3ff]"
            >
              −
            </button>
            <span className="min-w-10 text-center font-semibold text-white">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="flex h-12 w-12 items-center justify-center text-xl text-zinc-400 transition-colors hover:text-[#00f3ff]"
            >
              +
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={addToCart}
            disabled={!inStock}
            className={`flex-1 rounded-xl py-3.5 text-sm font-bold uppercase tracking-wider transition-all ${
              inStock
                ? "bg-[#00f3ff] text-black hover:shadow-[0_0_24px_rgba(0,243,255,0.4)]"
                : "cursor-not-allowed bg-zinc-800 text-zinc-500"
            }`}
          >
            {added
              ? t("product.addedToCart")
              : inStock
                ? t("product.addToCart")
                : t("product.outOfStock")}
          </button>
          <button
            type="button"
            onClick={addToCart}
            disabled={!inStock}
            className={`flex-1 rounded-xl border py-3.5 text-sm font-bold uppercase tracking-wider transition-all ${
              inStock
                ? "border-[#00f3ff] text-[#00f3ff] hover:bg-[#00f3ff]/10"
                : "cursor-not-allowed border-zinc-800 text-zinc-600"
            }`}
          >
            {t("product.buyNow")}
          </button>
        </div>

        {/* Description (Printify HTML) — uncontrolled markup can contain
            long URLs/tables; clamp every descendant to the column width */}
        {product.description && (
          <div
            className="mt-2 overflow-hidden break-words border-t border-zinc-800 pt-6 text-sm leading-7 text-zinc-400 [&_*]:max-w-full [&_a]:break-all [&_a]:text-[#00f3ff] [&_img]:h-auto [&_li]:mb-1 [&_p]:mb-3 [&_strong]:text-white [&_table]:block [&_table]:overflow-x-auto [&_ul]:list-disc [&_ul]:pl-5"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        )}
      </div>
    </div>
  );
}

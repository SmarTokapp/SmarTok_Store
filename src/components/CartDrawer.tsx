"use client";

import { useState } from "react";
import Image from "next/image";
import { useCart } from "@/store/cart";
import { useT } from "@/i18n/provider";
import { formatPrice } from "@/utils/format";

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, setQuantity, subtotal } =
    useCart();
  const { t } = useT();
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const handleCheckout = async () => {
    if (items.length === 0 || checkingOut) return;
    setCheckingOut(true);
    setCheckoutError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Checkout failed");
      }
      window.location.href = data.url;
    } catch (err) {
      console.error("[checkout]", err);
      setCheckoutError(t("cart.checkoutError"));
      setCheckingOut(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={closeCart}
        aria-hidden
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Panel */}
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-zinc-800 bg-zinc-950 shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <h2 className="text-lg font-bold text-white">{t("cart.title")}</h2>
          <button
            type="button"
            onClick={closeCart}
            aria-label={t("common.close")}
            className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-[#00f3ff]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <p className="text-base font-medium text-zinc-300">
                {t("cart.empty")}
              </p>
              <p className="max-w-xs text-sm text-zinc-500">
                {t("cart.emptyHint")}
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-4">
              {items.map((item) => (
                <li
                  key={item.key}
                  className="flex gap-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3"
                >
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-zinc-800">
                    {item.image && (
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    )}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <p className="line-clamp-2 text-sm font-semibold text-white">
                      {item.title}
                    </p>
                    <p className="text-xs text-zinc-500">{item.variantLabel}</p>

                    <div className="mt-auto flex items-center justify-between pt-2">
                      {/* Quantity stepper */}
                      <div className="flex items-center gap-2 rounded-lg border border-zinc-700">
                        <button
                          type="button"
                          onClick={() =>
                            setQuantity(item.key, item.quantity - 1)
                          }
                          className="px-2 py-1 text-zinc-400 transition-colors hover:text-[#00f3ff]"
                        >
                          −
                        </button>
                        <span className="min-w-6 text-center text-sm font-medium text-white">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setQuantity(item.key, item.quantity + 1)
                          }
                          className="px-2 py-1 text-zinc-400 transition-colors hover:text-[#00f3ff]"
                        >
                          +
                        </button>
                      </div>

                      <span className="text-sm font-bold text-[#00f3ff]">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(item.key)}
                    aria-label={t("cart.remove")}
                    className="self-start text-zinc-600 transition-colors hover:text-red-400"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.8}
                      className="h-4 w-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                      />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-zinc-800 px-6 py-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-zinc-400">{t("cart.subtotal")}</span>
              <span className="text-lg font-bold text-[#00f3ff]">
                {formatPrice(subtotal)}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCheckout}
              disabled={checkingOut}
              className={`w-full rounded-xl py-3.5 text-sm font-bold uppercase tracking-wider transition-all ${
                checkingOut
                  ? "cursor-wait bg-[#00f3ff]/60 text-black"
                  : "bg-[#00f3ff] text-black hover:shadow-[0_0_24px_rgba(0,243,255,0.4)]"
              }`}
            >
              {checkingOut ? t("cart.processing") : t("cart.checkout")}
            </button>
            {checkoutError && (
              <p className="mt-2 text-center text-xs text-red-400">
                {checkoutError}
              </p>
            )}
          </div>
        )}
      </aside>
    </>
  );
}

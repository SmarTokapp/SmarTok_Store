"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  collection,
  getDocs,
  orderBy,
  query,
  type DocumentData,
} from "firebase/firestore";
import { getFirebase, STORE_USERS_COLLECTION } from "@/lib/firebase";
import { useAuth } from "@/store/auth";
import { useT } from "@/i18n/provider";
import { formatPrice } from "@/utils/format";

interface OrderDoc extends DocumentData {
  orderId: string;
  items: {
    title: string;
    variantLabel?: string;
    image?: string | null;
    quantity: number;
    price: number;
  }[];
  total: number;
  currency: string;
  status: string;
  receiptUrl: string | null;
  createdAt: string;
}

export default function OrdersPage() {
  const { user, loading, openAuthModal } = useAuth();
  const { t, locale } = useT();
  const [orders, setOrders] = useState<OrderDoc[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      openAuthModal();
      setFetching(false);
      return;
    }
    const { db } = getFirebase();
    if (!db) {
      setFetching(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const q = query(
          collection(db, STORE_USERS_COLLECTION, user.uid, "orders"),
          orderBy("createdAt", "desc")
        );
        const snap = await getDocs(q);
        if (!cancelled) {
          setOrders(snap.docs.map((d) => d.data() as OrderDoc));
        }
      } catch (err) {
        // Missing composite index or empty subcollection → fall back unordered
        console.warn("[orders] ordered fetch failed, retrying unordered", err);
        try {
          const snap = await getDocs(
            collection(db, STORE_USERS_COLLECTION, user.uid, "orders")
          );
          if (!cancelled) {
            setOrders(
              snap.docs
                .map((d) => d.data() as OrderDoc)
                .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1))
            );
          }
        } catch (e) {
          console.error("[orders] fetch failed", e);
        }
      } finally {
        if (!cancelled) setFetching(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, loading, openAuthModal]);

  if (loading || fetching) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-[#00f3ff]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-20 text-center">
        <p className="text-zinc-400">{t("orders.loginRequired")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="mb-8 text-3xl font-bold text-white">{t("orders.title")}</h1>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 px-6 py-16 text-center">
          <p className="text-base font-medium text-zinc-300">
            {t("orders.empty")}
          </p>
          <p className="max-w-xs text-sm text-zinc-500">{t("orders.emptyHint")}</p>
          <Link
            href="/"
            className="mt-2 rounded-xl bg-[#00f3ff] px-5 py-2.5 text-sm font-bold text-black transition-all hover:shadow-[0_0_20px_rgba(0,243,255,0.4)]"
          >
            {t("success.continue")}
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {orders.map((order) => (
            <li
              key={order.orderId}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5"
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs text-zinc-500">
                    {t("orders.orderId")} #{order.orderId.slice(0, 12)}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleDateString(locale, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : ""}
                  </p>
                </div>
                <span className="rounded-full border border-[#00f3ff]/40 bg-[#00f3ff]/10 px-3 py-1 text-xs font-semibold text-[#00f3ff]">
                  {order.status || t("orders.statusProcessing")}
                </span>
              </div>

              <ul className="mb-4 flex flex-col gap-3">
                {(order.items ?? []).map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-zinc-800">
                      {item.image && (
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">
                        {item.title}
                      </p>
                      {item.variantLabel && (
                        <p className="text-xs text-zinc-500">{item.variantLabel}</p>
                      )}
                    </div>
                    <span className="text-xs text-zinc-400">
                      ×{item.quantity}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
                <span className="text-base font-bold text-[#00f3ff]">
                  {formatPrice(order.total)}
                </span>
                {order.receiptUrl && (
                  <a
                    href={order.receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-zinc-400 transition-colors hover:text-[#00f3ff]"
                  >
                    {t("orders.receipt")} →
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

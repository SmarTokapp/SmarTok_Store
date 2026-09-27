"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/store/auth";
import { useT } from "@/i18n/provider";

export default function UserMenu() {
  const { user, loading, openAuthModal, signOutUser, deleteAccount } = useAuth();
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click / Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (loading) {
    return <div className="h-10 w-10 shrink-0" aria-hidden />;
  }

  if (!user) {
    return (
      <button
        type="button"
        onClick={() => openAuthModal()}
        className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-full border border-zinc-700 px-3 text-xs font-semibold text-zinc-300 transition-colors hover:border-[#00f3ff] hover:text-[#00f3ff] sm:px-4 sm:text-sm"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
        </svg>
        {t("nav.login")}
      </button>
    );
  }

  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleDelete = async () => {
    if (!confirm(t("account.deleteConfirm"))) return;
    setDeleting(true);
    try {
      await deleteAccount();
    } catch (err) {
      console.error("[account] delete failed", err);
      setDeleting(false);
      alert(t("account.deleteError"));
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={t("account.menu")}
        aria-expanded={open}
        className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-zinc-700 bg-zinc-800 text-sm font-bold text-[#00f3ff] transition-colors hover:border-[#00f3ff]"
      >
        {user.photoURL && !avatarFailed ? (
          <Image
            src={user.photoURL}
            alt={user.name}
            width={40}
            height={40}
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
            onError={() => setAvatarFailed(true)}
          />
        ) : (
          initials || "?"
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl">
          <div className="border-b border-zinc-800 px-4 py-3">
            <p className="truncate text-sm font-semibold text-white">
              {user.name}
            </p>
            <p className="truncate text-xs text-zinc-500">{user.email}</p>
          </div>

          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-3 px-4 py-3 text-sm text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-[#00f3ff]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
            </svg>
            {t("account.settings")}
          </Link>

          <Link
            href="/orders"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-3 px-4 py-3 text-sm text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-[#00f3ff]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z" />
            </svg>
            {t("orders.title")}
          </Link>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              signOutUser();
            }}
            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-[#00f3ff]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
            </svg>
            {t("account.logout")}
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="flex w-full items-center gap-3 border-t border-zinc-800 px-4 py-3 text-left text-sm font-semibold text-red-400 transition-colors hover:bg-red-950/40 hover:text-red-300 disabled:cursor-wait disabled:opacity-60"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.108 48.108 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
            {deleting ? t("account.deleting") : t("account.delete")}
          </button>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/store/auth";
import { useT } from "@/i18n/provider";

export default function SettingsPage() {
  const { user, loading, openAuthModal, deleteAccount } = useAuth();
  const { t } = useT();
  const [deleting, setDeleting] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);

  // Guests get bounced to the login modal, then back to home if they bail.
  useEffect(() => {
    if (!loading && !user) openAuthModal();
  }, [loading, user, openAuthModal]);

  if (loading || !user) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-[#00f3ff]" />
      </div>
    );
  }

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
    <div className="mx-auto w-full max-w-xl px-4 py-12 sm:px-6">
      <h1 className="mb-8 text-3xl font-bold text-white">{t("account.settings")}</h1>

      <div className="space-y-4">
        {/* Profile card */}
        <div className="flex items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-800 text-lg font-bold text-[#00f3ff]">
            {user.photoURL && !avatarFailed ? (
              <Image
                src={user.photoURL}
                alt={user.name}
                width={56}
                height={56}
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
                onError={() => setAvatarFailed(true)}
              />
            ) : (
              user.name.slice(0, 1).toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-white">{user.name}</p>
            <p className="truncate text-sm text-zinc-500">{user.email}</p>
            <p className="mt-0.5 text-xs text-zinc-600">{t("account.viaGoogle")}</p>
          </div>
        </div>

        {/* Legal */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
          <h2 className="mb-3 text-sm font-semibold text-white">{t("legal.title")}</h2>
          <div className="flex flex-col gap-2 text-sm">
            <Link href="/privacy" className="text-zinc-400 transition-colors hover:text-[#00f3ff]">
              {t("legal.privacy")}
            </Link>
            <Link href="/terms" className="text-zinc-400 transition-colors hover:text-[#00f3ff]">
              {t("legal.terms")}
            </Link>
          </div>
        </div>

        {/* Danger zone */}
        <div className="rounded-2xl border border-red-900/50 bg-red-950/20 p-5">
          <h2 className="mb-2 text-sm font-semibold text-red-400">{t("account.dangerZone")}</h2>
          <p className="mb-4 text-xs leading-5 text-zinc-500">{t("account.deleteHint")}</p>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-lg border border-red-800 px-4 py-2 text-sm font-semibold text-red-400 transition-colors hover:bg-red-950 hover:text-red-300 disabled:cursor-wait disabled:opacity-60"
          >
            {deleting ? t("account.deleting") : t("account.delete")}
          </button>
        </div>
      </div>
    </div>
  );
}

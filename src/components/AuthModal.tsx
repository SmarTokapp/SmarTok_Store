"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/store/auth";
import { useT } from "@/i18n/provider";

export default function AuthModal() {
  const { authModalOpen, authModalReason, closeAuthModal, signInWithGoogle } =
    useAuth();
  const { t } = useT();
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!authModalOpen) return null;

  const handleGoogle = async () => {
    setSigningIn(true);
    setError(null);
    try {
      await signInWithGoogle();
      // onAuthStateChanged closes the modal on success
    } catch {
      setError(t("auth.error"));
      setSigningIn(false);
    }
  };

  return (
    <>
      <div
        onClick={closeAuthModal}
        aria-hidden
        className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("auth.title")}
        className="fixed left-1/2 top-1/2 z-[70] w-[90vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-zinc-800 bg-zinc-950 p-8 shadow-2xl"
      >
        <button
          type="button"
          onClick={closeAuthModal}
          aria-label={t("common.close")}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-[#00f3ff]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex flex-col items-center gap-2 text-center">
          <span className="text-2xl font-bold tracking-widest text-white">
            SMAR<span className="text-[#00f3ff]">TOK</span>
          </span>
          <h2 className="text-lg font-semibold text-white">{t("auth.title")}</h2>
          {authModalReason === "favorites" && (
            <p className="text-sm text-zinc-400">{t("auth.favoritesHint")}</p>
          )}
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={signingIn}
          className={`mt-6 flex w-full items-center justify-center gap-3 rounded-xl border border-zinc-700 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 transition-all hover:shadow-[0_0_20px_rgba(0,243,255,0.25)] ${
            signingIn ? "cursor-wait opacity-70" : ""
          }`}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          {signingIn ? t("auth.signingIn") : t("auth.google")}
        </button>

        {error && (
          <p className="mt-3 text-center text-xs text-red-400">{error}</p>
        )}

        <p className="mt-5 text-center text-[11px] leading-4 text-zinc-500">
          {t("auth.disclaimer.pre")}{" "}
          <Link href="/terms" className="text-[#00f3ff] hover:underline" onClick={closeAuthModal}>
            {t("legal.terms")}
          </Link>{" "}
          {t("auth.disclaimer.and")}{" "}
          <Link href="/privacy" className="text-[#00f3ff] hover:underline" onClick={closeAuthModal}>
            {t("legal.privacy")}
          </Link>
          .
        </p>
      </div>
    </>
  );
}

import { headers } from "next/headers";
import en from "./dictionaries/en.json";

export type Dictionary = Record<string, string>;

/** Supported locales — add more dictionaries and register them here. */
export const locales = ["en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

const dictionaries: Record<Locale, Dictionary> = { en };

/** Returns the dictionary for a locale, merged over English as fallback. */
export function getDictionary(locale: string): Dictionary {
  const dict = dictionaries[locale as Locale];
  return dict ? { ...en, ...dict } : { ...en };
}

/**
 * Detects the visitor's locale from the Accept-Language header.
 * Falls back to English when nothing matches the supported list.
 */
export async function getLocale(): Promise<Locale> {
  try {
    const acceptLanguage = (await headers()).get("accept-language") ?? "";
    const candidates = acceptLanguage
      .split(",")
      .map((part) => part.trim().split(";")[0]?.split("-")[0]?.toLowerCase())
      .filter(Boolean) as string[];
    for (const lang of candidates) {
      if ((locales as readonly string[]).includes(lang)) return lang as Locale;
    }
  } catch {
    // headers() unavailable (e.g. static prerender) — fall through
  }
  return defaultLocale;
}

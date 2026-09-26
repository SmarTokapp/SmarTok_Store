import { headers, cookies } from "next/headers";
import en from "./dictionaries/en.json";
import es from "./dictionaries/es.json";
import fr from "./dictionaries/fr.json";
import de from "./dictionaries/de.json";
import pt from "./dictionaries/pt.json";
import it from "./dictionaries/it.json";
import zh from "./dictionaries/zh.json";
import ja from "./dictionaries/ja.json";
import ar from "./dictionaries/ar.json";
import hi from "./dictionaries/hi.json";

export type Dictionary = Record<string, string>;

/** Supported locales — add more dictionaries and register them here. */
export const locales = ["en", "es", "fr", "de", "pt", "it", "zh", "ja", "ar", "hi"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

/** Cookie name for the user's explicit language choice (set by the switcher). */
export const LOCALE_COOKIE = "smartok_locale";

const dictionaries: Record<Locale, Dictionary> = {
  en, es, fr, de, pt, it, zh, ja, ar, hi,
};

/** Returns the dictionary for a locale, merged over English as fallback. */
export function getDictionary(locale: string): Dictionary {
  const dict = dictionaries[locale as Locale];
  return dict ? { ...en, ...dict } : { ...en };
}

/**
 * Locale resolution order:
 *   1. smartok_locale cookie (explicit user choice via the switcher)
 *   2. Accept-Language header (auto-detection on first visit)
 *   3. English fallback
 */
export async function getLocale(): Promise<Locale> {
  try {
    const cookieStore = await cookies();
    const saved = cookieStore.get(LOCALE_COOKIE)?.value;
    if (saved && (locales as readonly string[]).includes(saved)) {
      return saved as Locale;
    }
  } catch {
    // cookies() unavailable — fall through to header detection
  }

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

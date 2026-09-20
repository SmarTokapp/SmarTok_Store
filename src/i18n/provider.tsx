"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Dictionary, Locale } from "./index";

interface I18nContextValue {
  locale: Locale;
  /** Look up a key; `{name}` placeholders are replaced via `vars`. */
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue>({
  locale: "en",
  t: (key) => key,
});

export function I18nProvider({
  locale,
  dictionary,
  children,
}: {
  locale: Locale;
  dictionary: Dictionary;
  children: ReactNode;
}) {
  const t = (key: string, vars?: Record<string, string | number>) => {
    let text = dictionary[key] ?? key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        text = text.replace(`{${k}}`, String(v));
      }
    }
    return text;
  };
  return (
    <I18nContext.Provider value={{ locale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useT() {
  return useContext(I18nContext);
}

import type { Metadata } from "next";
import Link from "next/link";
import { getDictionary, getLocale } from "@/i18n";

export const metadata: Metadata = {
  title: "Privacy Policy — SmarTok Store",
  description: "How SmarTok Store collects, uses, and protects your data.",
};

const SECTIONS = [1, 2, 3, 4, 5, 6, 7] as const;

export default async function PrivacyPage() {
  const locale = await getLocale();
  const dict = getDictionary(locale);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="mb-2 text-3xl font-bold text-white">{dict["legal.privacy"]}</h1>
      <p className="mb-8 text-sm text-zinc-500">
        {dict["legal.lastUpdated"]}{" "}
        {new Date().toLocaleDateString(locale, {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </p>

      <div className="space-y-8 text-sm leading-6 text-zinc-300">
        {SECTIONS.map((n) => (
          <section key={n}>
            <h2 className="mb-2 text-lg font-semibold text-white">
              {dict[`privacy.s${n}.t`]}
            </h2>
            <p>{dict[`privacy.s${n}.b`]}</p>
          </section>
        ))}
      </div>

      <div className="mt-10">
        <Link href="/" className="text-sm text-[#00f3ff] hover:underline">
          {dict["legal.backToStore"]}
        </Link>
      </div>
    </div>
  );
}

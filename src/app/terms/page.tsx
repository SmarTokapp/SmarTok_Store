import type { Metadata } from "next";
import Link from "next/link";
import { getDictionary, getLocale } from "@/i18n";

export const metadata: Metadata = {
  title: "Terms of Service — SmarTok Store",
  description: "Terms governing use of the SmarTok Store.",
};

const SECTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

export default async function TermsPage() {
  const locale = await getLocale();
  const dict = getDictionary(locale);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="mb-2 text-3xl font-bold text-white">{dict["legal.terms"]}</h1>
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
              {dict[`terms.s${n}.t`]}
            </h2>
            <p>{dict[`terms.s${n}.b`]}</p>
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

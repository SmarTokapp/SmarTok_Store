import { getProducts } from "@/services/printify";
import { getLocale, getDictionary } from "@/i18n";
import ProductCard from "@/components/ProductCard";

function ComingSoon({ dict }: { dict: Record<string, string> }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-20">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#00f3ff]/10 blur-3xl"
      />
      <div className="relative flex flex-col items-center gap-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
          {dict["store.title"]}
        </h1>
        <p className="text-lg font-medium text-[#00f3ff] sm:text-xl">
          {dict["store.comingSoon"]}
        </p>
        <p className="max-w-md text-sm leading-6 text-zinc-400 sm:text-base">
          {dict["store.tagline"]}
        </p>
        <div className="h-px w-40 bg-gradient-to-r from-transparent via-[#00f3ff] to-transparent" />
      </div>
    </div>
  );
}

export default async function Home() {
  const [products, locale] = await Promise.all([getProducts(), getLocale()]);
  const dict = getDictionary(locale);

  if (products.length === 0) {
    return <ComingSoon dict={dict} />;
  }

  return (
    <div className="flex flex-1 flex-col px-4 py-10 sm:px-6">
      <header className="mx-auto mb-10 flex w-full max-w-6xl flex-col items-center gap-3 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          {dict["store.title"]}
        </h1>
        <div className="h-px w-40 bg-gradient-to-r from-transparent via-[#00f3ff] to-transparent" />
      </header>

      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            fromLabel={dict["product.from"]}
          />
        ))}
      </div>
    </div>
  );
}

import Image from "next/image";
import {
  getProducts,
  getPrimaryImage,
  getMinPrice,
  type PrintifyProduct,
} from "@/services/printify";
import { formatPrice } from "@/utils/format";

function ComingSoon() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#00f3ff]/10 blur-3xl"
      />
      <main className="relative flex flex-col items-center gap-8 text-center">
        <span className="rounded-full border border-[#00f3ff]/40 bg-[#00f3ff]/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-[#00f3ff]">
          SmarTok
        </span>
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
          SmarTok Store
        </h1>
        <p className="text-lg font-medium text-[#00f3ff] sm:text-xl">
          Coming Soon
        </p>
        <p className="max-w-md text-sm leading-6 text-zinc-400 sm:text-base">
          Exclusive merch and limited drops are on the way. Stay tuned.
        </p>
        <div className="h-px w-40 bg-gradient-to-r from-transparent via-[#00f3ff] to-transparent" />
      </main>
    </div>
  );
}

function ProductCard({ product }: { product: PrintifyProduct }) {
  const image = getPrimaryImage(product);
  const price = getMinPrice(product);

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 transition-colors hover:border-[#00f3ff]/50">
      <div className="relative aspect-square w-full bg-zinc-950">
        {image ? (
          <Image
            src={image}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-700">
            No image
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <h2 className="line-clamp-2 text-base font-semibold leading-snug text-white">
          {product.title}
        </h2>

        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-lg font-bold text-[#00f3ff]">
            {price !== null ? formatPrice(price) : "—"}
          </span>
          <button
            type="button"
            className="rounded-lg border border-[#00f3ff]/60 px-4 py-2 text-sm font-semibold text-[#00f3ff] transition-colors hover:bg-[#00f3ff] hover:text-black"
          >
            View
          </button>
        </div>
      </div>
    </article>
  );
}

export default async function Home() {
  const products = await getProducts();

  if (products.length === 0) {
    return <ComingSoon />;
  }

  return (
    <div className="flex flex-1 flex-col bg-black px-6 py-12 font-sans sm:px-10">
      <header className="mx-auto mb-10 flex w-full max-w-6xl flex-col items-center gap-3 text-center">
        <span className="rounded-full border border-[#00f3ff]/40 bg-[#00f3ff]/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-[#00f3ff]">
          SmarTok
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          SmarTok Store
        </h1>
        <div className="h-px w-40 bg-gradient-to-r from-transparent via-[#00f3ff] to-transparent" />
      </header>

      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}

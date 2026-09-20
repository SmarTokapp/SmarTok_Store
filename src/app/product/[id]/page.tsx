import Link from "next/link";
import { getProduct } from "@/services/printify";
import { getLocale, getDictionary } from "@/i18n";
import ProductView from "@/components/ProductView";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, locale] = await Promise.all([getProduct(id), getLocale()]);
  const dict = getDictionary(locale);

  if (!product) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
        <h1 className="text-2xl font-bold text-white">
          {dict["product.notFound"]}
        </h1>
        <Link
          href="/"
          className="rounded-lg border border-[#00f3ff] px-5 py-2.5 text-sm font-semibold text-[#00f3ff] transition-colors hover:bg-[#00f3ff]/10"
        >
          {dict["product.backToShop"]}
        </Link>
      </div>
    );
  }

  return <ProductView product={product} />;
}

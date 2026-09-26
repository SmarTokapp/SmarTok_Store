import Link from "next/link";
import Image from "next/image";
import {
  getPrimaryImage,
  getMinPrice,
  type PrintifyProduct,
} from "@/services/printify";
import { formatPrice } from "@/utils/format";
import FavoriteButton from "@/components/FavoriteButton";

export default function ProductCard({
  product,
  fromLabel = "From",
  noImageLabel = "No image",
}: {
  product: PrintifyProduct;
  fromLabel?: string;
  noImageLabel?: string;
}) {
  const image = getPrimaryImage(product);
  const price = getMinPrice(product);

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 transition-all duration-300 hover:-translate-y-1 hover:border-[#00f3ff]/50 hover:shadow-[0_0_30px_rgba(0,243,255,0.08)]">
      <FavoriteButton
        item={{ id: product.id, title: product.title, image, price }}
      />
      <Link href={`/product/${product.id}`} className="flex flex-1 flex-col">
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
              {noImageLabel}
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-2 p-5">
          <h2 className="line-clamp-2 text-base font-semibold leading-snug text-white transition-colors group-hover:text-[#00f3ff]">
            {product.title}
          </h2>
          <div className="mt-auto pt-2">
            <span className="text-lg font-bold text-[#00f3ff]">
              {price !== null ? `${fromLabel} ${formatPrice(price)}` : "—"}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}

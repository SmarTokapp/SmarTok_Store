import { NextResponse } from "next/server";
import { getProduct, getDefaultVariant } from "@/services/printify";

/**
 * GET /api/products/{id}/variant
 * Returns the product's default variant so client-side features (favorites
 * saved before variant capture existed) can add straight to cart.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await getProduct(id);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    const variant = getDefaultVariant(product);
    if (!variant) {
      return NextResponse.json({ error: "No variant" }, { status: 404 });
    }
    return NextResponse.json({
      variantId: variant.id,
      variantLabel: variant.title,
      price: variant.price,
    });
  } catch (err) {
    console.error("[variant] resolve failed", err);
    return NextResponse.json({ error: "Resolve failed" }, { status: 500 });
  }
}

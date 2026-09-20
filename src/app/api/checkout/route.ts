import { NextResponse } from "next/server";
import { getProduct } from "@/services/printify";

interface CheckoutItem {
  productId: string;
  variantId: number;
  title: string;
  image: string | null;
  price: number; // cents — verified against Printify before use
  quantity: number;
  variantLabel: string;
}

/**
 * POST /api/checkout
 * Body: { items: CheckoutItem[] }
 * Creates a Stripe Checkout Session and returns { url } for redirect.
 *
 * Env: STRIPE_SECRET_KEY (server-side only).
 * Prices are re-verified against Printify so a tampered client payload
 * cannot lower the amount charged.
 */
export async function POST(req: Request) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json(
      { error: "Stripe is not configured on the server." },
      { status: 500 }
    );
  }

  let items: CheckoutItem[];
  try {
    const body = await req.json();
    items = body?.items;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Cart is empty." }, { status: 400 });
  }

  // Server-side price verification via Printify (fall back to submitted
  // price if the product can't be fetched — better than blocking checkout
  // on a transient Printify outage).
  const verified: { name: string; image?: string; unitAmount: number; quantity: number }[] = [];

  for (const item of items) {
    const quantity = Math.min(99, Math.max(1, Math.floor(item.quantity || 1)));
    let unitAmount = Math.floor(item.price);

    try {
      const product = await getProduct(item.productId);
      if (product) {
        const variant = (product.variants ?? []).find(
          (v) => v.id === item.variantId
        );
        if (!variant || variant.is_enabled === false) {
          return NextResponse.json(
            { error: `Variant unavailable: ${item.title} (${item.variantLabel})` },
            { status: 400 }
          );
        }
        unitAmount = variant.price;
      }
    } catch {
      console.warn(`[checkout] price verification failed for ${item.productId} — using submitted price`);
    }

    if (!Number.isFinite(unitAmount) || unitAmount <= 0) {
      return NextResponse.json(
        { error: `Invalid price for ${item.title}` },
        { status: 400 }
      );
    }

    verified.push({
      name: item.variantLabel
        ? `${item.title} — ${item.variantLabel}`
        : item.title,
      image: item.image ?? undefined,
      unitAmount,
      quantity,
    });
  }

  const origin =
    req.headers.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    new URL(req.url).origin;

  // Stripe expects form-encoded params
  const params = new URLSearchParams();
  params.set("mode", "payment");
  params.set("success_url", `${origin}/success`);
  params.set("cancel_url", `${origin}/cancel`);

  verified.forEach((item, i) => {
    params.set(`line_items[${i}][price_data][currency]`, "usd");
    params.set(`line_items[${i}][price_data][unit_amount]`, String(item.unitAmount));
    params.set(`line_items[${i}][price_data][product_data][name]`, item.name);
    if (item.image) {
      params.set(`line_items[${i}][price_data][product_data][images][0]`, item.image);
    }
    params.set(`line_items[${i}][quantity]`, String(item.quantity));
  });

  try {
    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const session = await res.json();

    if (!res.ok || !session.url) {
      console.error("[checkout] Stripe error:", session?.error ?? session);
      return NextResponse.json(
        { error: session?.error?.message ?? "Failed to create checkout session." },
        { status: 502 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[checkout] Stripe request failed:", err);
    return NextResponse.json(
      { error: "Failed to reach Stripe." },
      { status: 502 }
    );
  }
}

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
  let uid: string | null = null;
  try {
    const body = await req.json();
    items = body?.items;
    uid = typeof body?.uid === "string" && body.uid ? body.uid : null;
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

  // Physical goods: collect a shipping address — the Stripe webhook hands it
  // to Printify for fulfillment. Country list is env-overridable.
  const shippingCountries = (
    process.env.STRIPE_SHIPPING_COUNTRIES ||
    "US,CA,GB,IE,DE,FR,ES,IT,PT,NL,BE,LU,AT,CH,SE,NO,DK,FI,PL,CZ,AU,NZ,JP,MX,BR,AR,CL,CO"
  )
    .split(",")
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean);
  shippingCountries.forEach((c, i) => {
    params.set(`shipping_address_collection[allowed_countries][${i}]`, c);
  });
  params.set("phone_number_collection[enabled]", "true");

  // Order attribution + Printify mapping consumed by /api/webhooks/stripe.
  // Per-line-item product metadata carries the Printify ids (session-level
  // metadata values are capped at 500 chars — a compact JSON is kept as a
  // fallback for small carts).
  if (uid) {
    params.set("client_reference_id", uid);
    params.set("metadata[uid]", uid);
  }
  const compactItems = items.map((i) => ({
    p: i.productId,
    v: i.variantId,
    q: Math.min(99, Math.max(1, Math.floor(i.quantity || 1))),
  }));
  const compactJson = JSON.stringify(compactItems);
  if (compactJson.length <= 480) params.set("metadata[items]", compactJson);

  verified.forEach((item, i) => {
    params.set(`line_items[${i}][price_data][currency]`, "usd");
    params.set(`line_items[${i}][price_data][unit_amount]`, String(item.unitAmount));
    params.set(`line_items[${i}][price_data][product_data][name]`, item.name);
    // Printify fulfillment mapping — survives into the created Product object.
    params.set(
      `line_items[${i}][price_data][product_data][metadata][product_id]`,
      items[i].productId
    );
    params.set(
      `line_items[${i}][price_data][product_data][metadata][variant_id]`,
      String(items[i].variantId)
    );
    params.set(
      `line_items[${i}][price_data][product_data][metadata][variant_label]`,
      items[i].variantLabel || ""
    );
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

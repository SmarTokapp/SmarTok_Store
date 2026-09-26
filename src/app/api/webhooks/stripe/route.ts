import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { createPrintifyOrder } from "@/services/printify";
import { getAdminDb } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

const STRIPE_API = "https://api.stripe.com/v1";

/**
 * POST /api/webhooks/stripe
 * Listens for checkout.session.completed → creates the Printify fulfillment
 * order automatically → records the order in Firestore under
 * store_users/{uid}/orders/{orderId} (or store_orders/{sessionId} for
 * guest checkouts).
 *
 * Env:
 *   STRIPE_SECRET_KEY       — to re-fetch the session with expansions
 *   STRIPE_WEBHOOK_SECRET   — whsec_... from `stripe listen` / dashboard
 *   PRINTIFY_API_TOKEN      — already set (product catalog)
 *   PRINTIFY_SHOP_ID        — optional override (auto-resolved otherwise)
 *   FIREBASE_SERVICE_ACCOUNT or FIREBASE_ADMIN_* — for order persistence
 */

// ─── Stripe signature verification (manual — no stripe SDK needed) ──────────
function verifySignature(rawBody: string, header: string, secret: string): boolean {
  try {
    const entries = header.split(",").map((p) => p.trim());
    const timestamp = entries.find((p) => p.startsWith("t="))?.slice(2);
    const signatures = entries
      .filter((p) => p.startsWith("v1="))
      .map((p) => p.slice(3));
    if (!timestamp || signatures.length === 0) return false;

    // Reject signatures older than 5 minutes (replay protection)
    const age = Math.abs(Date.now() / 1000 - Number(timestamp));
    if (age > 300) return false;

    const expected = crypto
      .createHmac("sha256", secret)
      .update(`${timestamp}.${rawBody}`)
      .digest("hex");
    const expectedBuf = Buffer.from(expected, "utf8");
    return signatures.some((sig) => {
      const sigBuf = Buffer.from(sig, "utf8");
      return (
        sigBuf.length === expectedBuf.length &&
        crypto.timingSafeEqual(sigBuf, expectedBuf)
      );
    });
  } catch {
    return false;
  }
}

async function stripeGet(path: string, secret: string) {
  const res = await fetch(`${STRIPE_API}${path}`, {
    headers: { Authorization: `Bearer ${secret}` },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message || `Stripe HTTP ${res.status}`);
  return json;
}

interface MetaItem {
  p: string;
  v: number;
  q: number;
}

export async function POST(req: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  if (!webhookSecret || !stripeSecret) {
    console.error("[webhook] Stripe secrets not configured");
    return NextResponse.json({ error: "Webhook not configured." }, { status: 500 });
  }

  const rawBody = await req.text();
  const sigHeader = req.headers.get("stripe-signature") || "";
  if (!verifySignature(rawBody, sigHeader, webhookSecret)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  let event: { type: string; data: { object: { id: string } } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  try {
    // Re-fetch the session with line items + charge expanded — the webhook
    // payload doesn't include them.
    const session = await stripeGet(
      `/checkout/sessions/${event.data.object.id}?expand[]=line_items.data.price.product&expand[]=payment_intent.latest_charge`,
      stripeSecret
    );

    const uid: string | null =
      session.metadata?.uid || session.client_reference_id || null;

    // ── Map line items → Printify variants ──
    const lineItems = session.line_items?.data ?? [];
    let items: MetaItem[] = lineItems
      .map((li: any) => ({
        p: li?.price?.product?.metadata?.product_id,
        v: Number(li?.price?.product?.metadata?.variant_id),
        q: li?.quantity || 1,
        title: li?.price?.product?.name || li?.description || "Item",
        variantLabel: li?.price?.product?.metadata?.variant_label || "",
        image: li?.price?.product?.images?.[0] || null,
        price: li?.amount_total ?? li?.price?.unit_amount ?? 0,
      }))
      .filter((i: any) => i.p && Number.isFinite(i.v));

    // Fallback: compact items JSON stored on session metadata.
    if (items.length === 0 && session.metadata?.items) {
      try {
        const compact = JSON.parse(session.metadata.items) as MetaItem[];
        items = compact.map((c) => ({ ...c, title: "Item", variantLabel: "", image: null, price: 0 } as any));
      } catch {}
    }

    if (items.length === 0) {
      console.error(`[webhook] session ${session.id} has no mappable items`);
      return NextResponse.json({ received: true }); // unrecoverable — don't retry
    }

    // ── Shipping address → Printify address_to ──
    const ship = session.shipping_details;
    const name = (ship?.name || session.customer_details?.name || "Customer").trim();
    const spaceIdx = name.indexOf(" ");
    const firstName = spaceIdx > 0 ? name.slice(0, spaceIdx) : name;
    const lastName = spaceIdx > 0 ? name.slice(spaceIdx + 1) : "-";
    const addr = ship?.address || session.customer_details?.address || {};

    if (!addr.country || !addr.line1 || !addr.city) {
      console.error(`[webhook] session ${session.id} missing shipping address`);
      return NextResponse.json({ received: true });
    }

    // ── Create the Printify fulfillment order ──
    const printifyOrder = await createPrintifyOrder({
      externalId: session.id,
      lineItems: items.map((i: any) => ({
        product_id: i.p,
        variant_id: i.v,
        quantity: i.q,
      })),
      address: {
        first_name: firstName,
        last_name: lastName,
        email: session.customer_details?.email || session.customer_email || "",
        phone: ship?.phone || session.customer_details?.phone || "",
        country: addr.country,
        region: addr.state || "",
        address1: addr.line1,
        address2: addr.line2 || "",
        city: addr.city,
        zip: addr.postal_code || "",
      },
    });

    if (!printifyOrder) {
      // Transient Printify failure → 500 so Stripe retries the webhook.
      return NextResponse.json(
        { error: "Printify order creation failed." },
        { status: 500 }
      );
    }

    // ── Persist the order in Firestore ──
    const receiptUrl: string | null =
      session.payment_intent?.latest_charge?.receipt_url || null;
    const orderDoc = {
      orderId: printifyOrder.id,
      sessionId: session.id,
      items: items.map((i: any) => ({
        title: i.title,
        variantLabel: i.variantLabel,
        image: i.image,
        quantity: i.q,
        price: i.price,
      })),
      total: session.amount_total ?? 0,
      currency: session.currency || "usd",
      status: "Processing",
      receiptUrl,
      email: session.customer_details?.email || session.customer_email || null,
      createdAt: new Date().toISOString(),
    };

    const adminDb = getAdminDb();
    if (adminDb) {
      try {
        if (uid) {
          await adminDb
            .collection("store_users")
            .doc(uid)
            .collection("orders")
            .doc(printifyOrder.id)
            .set(orderDoc);
        } else {
          // Guest checkout — keep the record under a top-level collection.
          await adminDb
            .collection("store_orders")
            .doc(printifyOrder.id)
            .set(orderDoc);
        }
      } catch (err) {
        console.error("[webhook] Firestore order write failed:", err);
      }
    } else {
      console.warn(
        `[webhook] order ${printifyOrder.id} created in Printify but Firestore admin is not configured — order not recorded for user ${uid}`
      );
    }

    console.log(
      `[webhook] fulfilled session ${session.id} → Printify order ${printifyOrder.id} (uid: ${uid ?? "guest"})`
    );
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[webhook] processing error:", err);
    return NextResponse.json({ error: "Processing failed." }, { status: 500 });
  }
}

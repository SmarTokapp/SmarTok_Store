/**
 * Printify API service layer.
 *
 * Server-side only — reads credentials from:
 *   PRINTIFY_API_TOKEN  — Bearer token for the Printify API
 *   PRINTIFY_SHOP_ID    — (optional) manual override; if unset, the shop id
 *                         is resolved automatically via GET /v1/shops.json
 *
 * All helpers degrade gracefully: if the token is missing or the API
 * errors, they return empty data so the storefront can fall back to
 * the "Coming Soon" placeholder instead of crashing.
 */

export const PRINTIFY_API_BASE = "https://api.printify.com/v1";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PrintifyImage {
  src: string;
  variant_ids: number[];
  position: string;
  is_default: boolean;
}

export interface PrintifyVariant {
  id: number;
  sku: string;
  cost: number;
  price: number; // cents
  title: string;
  grams: number;
  is_enabled: boolean;
  is_default: boolean;
  is_available: boolean;
  options: number[];
}

export interface PrintifyProduct {
  id: string;
  title: string;
  description: string; // HTML
  tags: string[];
  images: PrintifyImage[];
  variants: PrintifyVariant[];
  visible: boolean;
  is_locked: boolean;
  blueprint_id: number;
  print_provider_id: number;
  created_at: string;
  updated_at: string;
}

interface PrintifyShop {
  id: number;
  title: string;
  channel: string;
}

interface PrintifyProductsResponse {
  current_page: number;
  data: PrintifyProduct[];
  last_page: number;
  total: number;
}

// ─── Shop resolution ────────────────────────────────────────────────────────

let cachedShopId: string | null = null;

/**
 * Resolves the shop id: PRINTIFY_SHOP_ID env override first, otherwise
 * GET /v1/shops.json and use the first shop on the account. Cached for
 * the process lifetime so pagination never re-fetches it.
 */
async function resolveShopId(token: string): Promise<string | null> {
  if (process.env.PRINTIFY_SHOP_ID) return process.env.PRINTIFY_SHOP_ID;
  if (cachedShopId) return cachedShopId;

  const res = await fetch(`${PRINTIFY_API_BASE}/shops.json`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    console.error(`[printify] shops fetch failed: HTTP ${res.status}`);
    return null;
  }

  const shops = (await res.json()) as PrintifyShop[];
  const first = shops[0];
  if (!first?.id) {
    console.warn("[printify] Account has no shops.");
    return null;
  }

  cachedShopId = String(first.id);
  console.log(`[printify] Using shop "${first.title}" (id: ${cachedShopId})`);
  return cachedShopId;
}

// ─── Fetch ──────────────────────────────────────────────────────────────────

/**
 * Fetches all published products from the Printify shop.
 * Paginates through `last_page` so nothing is missed.
 * Revalidates every 5 minutes (ISR).
 */
export async function getProducts(): Promise<PrintifyProduct[]> {
  const token = process.env.PRINTIFY_API_TOKEN;
  if (!token) {
    console.warn("[printify] PRINTIFY_API_TOKEN not set — returning empty catalog.");
    return [];
  }

  const shopId = await resolveShopId(token);
  if (!shopId) return [];

  try {
    const products: PrintifyProduct[] = [];
    let page = 1;
    let lastPage = 1;

    do {
      const res = await fetch(
        `${PRINTIFY_API_BASE}/shops/${shopId}/products.json?page=${page}&limit=50`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          next: { revalidate: 300 },
        }
      );

      if (!res.ok) {
        console.error(`[printify] products fetch failed: HTTP ${res.status}`);
        return products; // return what we have; page falls back if empty
      }

      const json = (await res.json()) as PrintifyProductsResponse;
      products.push(...(json.data ?? []));
      lastPage = json.last_page ?? 1;
      page++;
    } while (page <= lastPage);

    return products.filter((p) => p.visible !== false);
  } catch (err) {
    console.error("[printify] products fetch error:", err);
    return [];
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Primary product image: the default mockup, else the first available. */
export function getPrimaryImage(product: PrintifyProduct): string | null {
  const images = product.images ?? [];
  const def = images.find((img) => img.is_default);
  return (def ?? images[0])?.src ?? null;
}

/** Lowest enabled variant price, in cents. Null if none are enabled. */
export function getMinPrice(product: PrintifyProduct): number | null {
  const enabled = (product.variants ?? []).filter(
    (v) => v.is_enabled && v.is_available !== false
  );
  if (enabled.length === 0) return null;
  return Math.min(...enabled.map((v) => v.price));
}

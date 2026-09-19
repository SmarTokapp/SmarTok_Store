/**
 * Printify API service layer.
 *
 * Server-side only — reads credentials from:
 *   PRINTIFY_API_TOKEN  — Bearer token for the Printify API
 *   PRINTIFY_SHOP_ID    — SmarTok shop id
 *
 * All helpers degrade gracefully: if env vars are missing or the API
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

interface PrintifyProductsResponse {
  current_page: number;
  data: PrintifyProduct[];
  last_page: number;
  total: number;
}

// ─── Fetch ──────────────────────────────────────────────────────────────────

/**
 * Fetches all published products from the configured Printify shop.
 * Paginates through `last_page` so nothing is missed.
 * Revalidates every 5 minutes (ISR).
 */
export async function getProducts(): Promise<PrintifyProduct[]> {
  const token = process.env.PRINTIFY_API_TOKEN;
  const shopId = process.env.PRINTIFY_SHOP_ID;
  if (!token || !shopId) {
    console.warn("[printify] PRINTIFY_API_TOKEN or PRINTIFY_SHOP_ID not set — returning empty catalog.");
    return [];
  }

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

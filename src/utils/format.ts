/**
 * Shared formatting utilities for the storefront.
 */

/** Format a price in cents as a localized currency string. */
export function formatPrice(
  cents: number,
  currency: string = "USD",
  locale: string = "en-US"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(cents / 100);
}

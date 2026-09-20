"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export interface CartItem {
  key: string; // `${productId}:${variantId}`
  productId: string;
  variantId: number;
  title: string;
  image: string | null;
  price: number; // cents
  quantity: number;
  variantLabel: string; // e.g. "Black / XL"
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number; // cents
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: Omit<CartItem, "key">) => void;
  removeItem: (key: string) => void;
  setQuantity: (key: string, quantity: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "smartok-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Load persisted cart once (client only)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // corrupted storage — start empty
    }
    setHydrated(true);
  }, []);

  // Persist on change (after hydration so we don't clobber stored data)
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // storage full/blocked — cart still works in-memory
    }
  }, [items, hydrated]);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((n, i) => n + i.quantity, 0);
    const subtotal = items.reduce((n, i) => n + i.price * i.quantity, 0);
    return {
      items,
      count,
      subtotal,
      isOpen,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      addItem: (item) => {
        const key = `${item.productId}:${item.variantId}`;
        setItems((prev) => {
          const existing = prev.find((i) => i.key === key);
          if (existing) {
            return prev.map((i) =>
              i.key === key ? { ...i, quantity: i.quantity + item.quantity } : i
            );
          }
          return [...prev, { ...item, key }];
        });
        setIsOpen(true);
      },
      removeItem: (key) => setItems((prev) => prev.filter((i) => i.key !== key)),
      setQuantity: (key, quantity) =>
        setItems((prev) =>
          quantity <= 0
            ? prev.filter((i) => i.key !== key)
            : prev.map((i) => (i.key === key ? { ...i, quantity } : i))
        ),
      clear: () => setItems([]),
    };
  }, [items, isOpen, hydrated]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}

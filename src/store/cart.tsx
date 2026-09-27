"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { getFirebase, STORE_USERS_COLLECTION } from "@/lib/firebase";
import { useAuth } from "@/store/auth";

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
  addItem: (
    item: Omit<CartItem, "key">,
    opts?: { openCart?: boolean }
  ) => void;
  removeItem: (key: string) => void;
  setQuantity: (key: string, quantity: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "smartok-cart";

/** Merge remote cart into local guest cart — quantities sum by variant key. */
function mergeCarts(local: CartItem[], remote: CartItem[]): CartItem[] {
  const map = new Map<string, CartItem>();
  remote.forEach((i) => map.set(i.key, { ...i }));
  local.forEach((i) => {
    const existing = map.get(i.key);
    if (existing) {
      existing.quantity += i.quantity;
    } else {
      map.set(i.key, { ...i });
    }
  });
  return Array.from(map.values());
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  // Prevents writing straight back the array we just applied from Firestore.
  const lastSyncedRef = useRef<string>("[]");

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

  // On login: merge the guest cart into the account cart (once per session).
  useEffect(() => {
    if (!user || !hydrated) return;
    const { db } = getFirebase();
    if (!db) return;
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db, STORE_USERS_COLLECTION, user.uid));
        if (cancelled) return;
        const remote: CartItem[] = Array.isArray(snap.data()?.cart)
          ? snap.data()!.cart
          : [];
        const merged = mergeCarts(items, remote);
        if (JSON.stringify(merged) !== JSON.stringify(items)) {
          setItems(merged);
          lastSyncedRef.current = JSON.stringify(merged);
        }
        await setDoc(
          doc(db, STORE_USERS_COLLECTION, user.uid),
          { cart: merged, updatedAt: serverTimestamp() },
          { merge: true }
        );
      } catch (err) {
        console.warn("[cart] remote sync failed — staying local", err);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, hydrated]);

  // Persist on change: localStorage always, Firestore when logged in
  // (after hydration so we don't clobber stored data).
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // storage full/blocked — cart still works in-memory
    }
    if (!user) return;
    const serialized = JSON.stringify(items);
    if (serialized === lastSyncedRef.current) return;
    lastSyncedRef.current = serialized;
    const { db } = getFirebase();
    if (!db) return;
    setDoc(
      doc(db, STORE_USERS_COLLECTION, user.uid),
      { cart: items, updatedAt: serverTimestamp() },
      { merge: true }
    ).catch((err) => console.warn("[cart] remote write failed", err));
  }, [items, hydrated, user]);

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
      addItem: (item, opts) => {
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
        if (opts?.openCart !== false) setIsOpen(true);
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

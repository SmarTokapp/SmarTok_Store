"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { getFirebase, STORE_USERS_COLLECTION } from "@/lib/firebase";
import { useAuth } from "@/store/auth";

export interface FavoriteItem {
  id: string; // Printify product id
  title: string;
  image: string | null;
  price: number | null; // cents
}

interface FavoritesContextValue {
  favorites: FavoriteItem[];
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (item: FavoriteItem) => void;
  removeFavorite: (productId: string) => void;
  isOpen: boolean;
  openFavorites: () => void;
  closeFavorites: () => void;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);
const localKey = (uid: string) => `smartok-favorites-${uid}`;

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user, openAuthModal } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Instant paint: hydrate the per-account local cache, then the remote doc.
  useEffect(() => {
    if (!user) {
      setFavorites([]);
      setLoaded(false);
      return;
    }
    try {
      const raw = localStorage.getItem(localKey(user.uid));
      if (raw) setFavorites(JSON.parse(raw));
    } catch {}
    let cancelled = false;
    const { db } = getFirebase();
    if (!db) {
      setLoaded(true);
      return;
    }
    (async () => {
      try {
        const snap = await getDoc(doc(db, STORE_USERS_COLLECTION, user.uid));
        if (cancelled) return;
        const remote: FavoriteItem[] = Array.isArray(snap.data()?.favorites)
          ? snap.data()!.favorites
          : [];
        if (remote.length > 0 || favorites.length === 0) {
          setFavorites(remote);
        } else {
          // Local cache has entries the remote doc doesn't — push them up.
          await setDoc(
            doc(db, STORE_USERS_COLLECTION, user.uid),
            { favorites, updatedAt: serverTimestamp() },
            { merge: true }
          );
        }
      } catch (err) {
        console.warn("[favorites] remote load failed — staying local", err);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  // Mirror locally for instant paint on next visit.
  useEffect(() => {
    if (!user || !loaded) return;
    try {
      localStorage.setItem(localKey(user.uid), JSON.stringify(favorites));
    } catch {}
  }, [favorites, user, loaded]);

  const persistRemote = useCallback(
    (next: FavoriteItem[]) => {
      if (!user) return;
      const { db } = getFirebase();
      if (!db) return;
      setDoc(
        doc(db, STORE_USERS_COLLECTION, user.uid),
        { favorites: next, updatedAt: serverTimestamp() },
        { merge: true }
      ).catch((err) => console.warn("[favorites] remote write failed", err));
    },
    [user]
  );

  const isFavorite = useCallback(
    (productId: string) => favorites.some((f) => f.id === productId),
    [favorites]
  );

  const toggleFavorite = useCallback(
    (item: FavoriteItem) => {
      if (!user) {
        openAuthModal("favorites");
        return;
      }
      setFavorites((prev) => {
        const exists = prev.some((f) => f.id === item.id);
        const next = exists ? prev.filter((f) => f.id !== item.id) : [...prev, item];
        persistRemote(next);
        return next;
      });
    },
    [user, openAuthModal, persistRemote]
  );

  const removeFavorite = useCallback(
    (productId: string) => {
      if (!user) return;
      setFavorites((prev) => {
        const next = prev.filter((f) => f.id !== productId);
        persistRemote(next);
        return next;
      });
    },
    [user, persistRemote]
  );

  const value = useMemo<FavoritesContextValue>(
    () => ({
      favorites,
      isFavorite,
      toggleFavorite,
      removeFavorite,
      isOpen,
      openFavorites: () => setIsOpen(true),
      closeFavorites: () => setIsOpen(false),
    }),
    [favorites, isFavorite, toggleFavorite, removeFavorite, isOpen]
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx)
    throw new Error("useFavorites must be used inside <FavoritesProvider>");
  return ctx;
}

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
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
  deleteUser,
  reauthenticateWithPopup,
  type User,
} from "firebase/auth";
import { doc, deleteDoc, setDoc, serverTimestamp } from "firebase/firestore";
import {
  getFirebase,
  getGoogleProvider,
  STORE_USERS_COLLECTION,
} from "@/lib/firebase";

export interface StoreUser {
  uid: string;
  name: string;
  email: string;
  photoURL: string | null;
}

interface AuthContextValue {
  user: StoreUser | null;
  loading: boolean;
  authModalOpen: boolean;
  authModalReason: string | null;
  openAuthModal: (reason?: string) => void;
  closeAuthModal: () => void;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function toStoreUser(u: User): StoreUser {
  return {
    uid: u.uid,
    name: u.displayName || u.email?.split("@")[0] || "User",
    email: u.email || "",
    photoURL: u.photoURL,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StoreUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalReason, setAuthModalReason] = useState<string | null>(null);

  useEffect(() => {
    const { auth } = getFirebase();
    if (!auth) {
      setLoading(false);
      return;
    }
    return onAuthStateChanged(auth, (u) => {
      setUser(u ? toStoreUser(u) : null);
      setLoading(false);
      if (u) {
        setAuthModalOpen(false);
        setAuthModalReason(null);
        // Upsert the profile shadow-doc so cart/favorites always have an owner row.
        const { db } = getFirebase();
        if (db) {
          setDoc(
            doc(db, STORE_USERS_COLLECTION, u.uid),
            {
              profile: {
                name: u.displayName || "",
                email: u.email || "",
                photoURL: u.photoURL || "",
              },
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          ).catch(() => {});
        }
      }
    });
  }, []);

  const openAuthModal = useCallback((reason?: string) => {
    setAuthModalReason(reason || null);
    setAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setAuthModalOpen(false);
    setAuthModalReason(null);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { auth } = getFirebase();
    if (!auth) return;
    const provider = getGoogleProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || "";
      // Popup blocked / unsupported → fall back to full-page redirect.
      if (
        code === "auth/popup-blocked" ||
        code === "auth/popup-closed-by-user" ||
        code === "auth/operation-not-supported-in-this-environment"
      ) {
        if (code !== "auth/popup-closed-by-user") {
          await signInWithRedirect(auth, provider);
        }
        return;
      }
      throw err;
    }
  }, []);

  const signOutUser = useCallback(async () => {
    const { auth } = getFirebase();
    if (!auth) return;
    await firebaseSignOut(auth);
    try {
      localStorage.removeItem("smartok-cart");
    } catch {}
    if (typeof window !== "undefined") window.location.assign("/");
  }, []);

  const deleteAccount = useCallback(async () => {
    const { auth, db } = getFirebase();
    const current = auth?.currentUser;
    if (!auth || !current) return;

    const removeData = async () => {
      if (db) {
        await deleteDoc(doc(db, STORE_USERS_COLLECTION, current.uid)).catch(
          () => {}
        );
      }
      await deleteUser(current);
    };

    try {
      await removeData();
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || "";
      if (code === "auth/requires-recent-login") {
        // Re-authenticate via Google, then retry the deletion.
        await reauthenticateWithPopup(current, getGoogleProvider());
        await removeData();
      } else {
        throw err;
      }
    }

    try {
      localStorage.removeItem("smartok-cart");
      localStorage.removeItem(`smartok-favorites-${current.uid}`);
    } catch {}
    await firebaseSignOut(auth).catch(() => {});
    if (typeof window !== "undefined") window.location.assign("/");
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      authModalOpen,
      authModalReason,
      openAuthModal,
      closeAuthModal,
      signInWithGoogle,
      signOutUser,
      deleteAccount,
    }),
    [
      user,
      loading,
      authModalOpen,
      authModalReason,
      openAuthModal,
      closeAuthModal,
      signInWithGoogle,
      signOutUser,
      deleteAccount,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

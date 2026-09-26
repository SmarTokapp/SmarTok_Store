import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

/**
 * Server-side Firebase Admin — used by the Stripe webhook to write order
 * documents under store_users/{uid}/orders/{orderId}, bypassing client-side
 * Firestore auth rules.
 *
 * Env vars (Vercel):
 *   FIREBASE_SERVICE_ACCOUNT  — full service-account JSON (preferred), or
 *   FIREBASE_ADMIN_PROJECT_ID + FIREBASE_ADMIN_CLIENT_EMAIL +
 *   FIREBASE_ADMIN_PRIVATE_KEY — the three fields separately (private key
 *   may contain literal \n sequences; they are normalized).
 *
 * Returns null when no credentials are configured — callers degrade to a
 * logged warning instead of crashing fulfillment.
 */
export function getAdminDb(): Firestore | null {
  try {
    if (getApps().length === 0) {
      const saJson = process.env.FIREBASE_SERVICE_ACCOUNT;
      let app: App;

      if (saJson) {
        app = initializeApp({ credential: cert(JSON.parse(saJson)) });
      } else if (
        process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
        process.env.FIREBASE_ADMIN_PRIVATE_KEY
      ) {
        app = initializeApp({
          credential: cert({
            projectId:
              process.env.FIREBASE_ADMIN_PROJECT_ID || "smartok-22402",
            clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(
              /\\n/g,
              "\n"
            ),
          }),
        });
      } else {
        console.warn("[firebase-admin] no credentials configured");
        return null;
      }
      return getFirestore(app);
    }
    return getFirestore();
  } catch (err) {
    console.error("[firebase-admin] init failed:", err);
    return null;
  }
}

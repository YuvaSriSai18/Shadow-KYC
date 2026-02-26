/**
 * secureShareFirebase.ts
 * Re-uses the same Firebase project already configured in the app.
 * Safely gets the default app if already initialized, or initializes it.
 * Exports Firestore (db) and Storage for the secure file-share feature.
 */

import { getApps, initializeApp, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage }   from 'firebase/storage';

const firebaseConfig = {
  apiKey:            "AIzaSyBM4Ovh9vntFKb88UcTAikp3RTHY8tOgq0",
  authDomain:        "yuvasrisai18.firebaseapp.com",
  projectId:         "yuvasrisai18",
  storageBucket:     "yuvasrisai18.appspot.com",
  messagingSenderId: "768724746378",
  appId:             "1:768724746378:web:84fb91e17bcfbf1099ad73",
};

// Reuse default app if already initialized (avoids "duplicate app" error)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db      = getFirestore(app);
export const storage = getStorage(app);

// ─── Public-key registry helpers ─────────────────────────────────────────────
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Called by the RECEIVER once.
 * Stores their MetaMask x25519 encryption public key in Firestore so
 * senders can look it up without having to access the receiver's MetaMask.
 */
export async function registerPublicKey(address: string, pubKey: string): Promise<void> {
  await setDoc(doc(db, 'publicKeys', address.toLowerCase()), {
    address:      address.toLowerCase(),
    pubKey,
    registeredAt: serverTimestamp(),
  });
}

/**
 * Called by the SENDER.
 * Returns the receiver's pre-registered x25519 public key, or null if
 * they haven't registered yet.
 */
export async function getReceiverPublicKey(address: string): Promise<string | null> {
  const snap = await getDoc(doc(db, 'publicKeys', address.toLowerCase()));
  if (!snap.exists()) return null;
  return (snap.data() as { pubKey: string }).pubKey;
}

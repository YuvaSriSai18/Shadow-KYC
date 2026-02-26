/**
 * cryptoUtils.js
 * ──────────────────────────────────────────────────────────────────────────
 * All encryption / decryption lives here.  Nothing sensitive ever leaves
 * this module or the browser — private keys stay inside MetaMask at all
 * times.
 *
 * Flow overview
 * ─────────────
 *  SENDER
 *   1. getEncryptionPublicKey(account)           → receiver's x25519 pub key
 *   2. generateAESKey()                          → CryptoKey (AES-256-GCM)
 *   3. encryptFileAES(key, fileBuffer)           → { iv, ciphertext }
 *   4. packEncryptedFile(iv, ciphertext)         → Blob  (upload to Storage)
 *   5. encryptAESKeyForReceiver(pubKey, rawKey)  → base64 string (store in Firestore)
 *
 *  RECEIVER
 *   1. (download encrypted Blob from Storage)
 *   2. unpackEncryptedFile(buffer)               → { iv, ciphertext }
 *   3. decryptAESKeyWithMetaMask(account, encB64) → rawKey ArrayBuffer
 *   4. importAESKey(rawKey)                       → CryptoKey
 *   5. decryptFileAES(key, iv, ciphertext)        → plaintext ArrayBuffer
 */

import { encrypt } from '@metamask/eth-sig-util';
import { Buffer } from 'buffer';

// ─── MetaMask helpers ─────────────────────────────────────────────────────────

export async function getEncryptionPublicKey(account) {
  if (!window.ethereum) throw new Error('MetaMask is not installed.');
  try {
    const publicKey = await window.ethereum.request({
      method: 'eth_getEncryptionPublicKey',
      params: [account],
    });
    return publicKey;
  } catch (err) {
    if (err.code === 4001) throw new Error('User rejected the encryption key request.');
    throw new Error(`eth_getEncryptionPublicKey failed: ${err.message}`);
  }
}

export async function decryptAESKeyWithMetaMask(account, encryptedAESKeyB64) {
  if (!window.ethereum) throw new Error('MetaMask is not installed.');
  const jsonStr = Buffer.from(encryptedAESKeyB64, 'base64').toString('utf8');
  const hexEncrypted = '0x' + Buffer.from(jsonStr, 'utf8').toString('hex');
  try {
    const decryptedBase64 = await window.ethereum.request({
      method: 'eth_decrypt',
      params: [hexEncrypted, account],
    });
    return Buffer.from(decryptedBase64, 'base64').buffer;
  } catch (err) {
    if (err.code === 4001) throw new Error('User rejected the decryption request.');
    throw new Error(`eth_decrypt failed: ${err.message}`);
  }
}

// ─── AES-256-GCM key helpers ──────────────────────────────────────────────────

export async function generateAESKey() {
  return await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt'],
  );
}

export async function exportAESKey(key) {
  return await crypto.subtle.exportKey('raw', key);
}

export async function importAESKey(rawKey) {
  return await crypto.subtle.importKey(
    'raw',
    rawKey,
    { name: 'AES-GCM' },
    false,
    ['decrypt'],
  );
}

// ─── File encryption / decryption ────────────────────────────────────────────

export async function encryptFileAES(aesKey, fileBuffer) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    fileBuffer,
  );
  return { iv, ciphertext };
}

export async function decryptFileAES(aesKey, iv, ciphertext) {
  try {
    return await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      aesKey,
      ciphertext,
    );
  } catch {
    throw new Error('AES-GCM decryption failed — wrong key or corrupted file.');
  }
}

// ─── AES key asymmetric encryption ────────────────────────────────────────────

export function encryptAESKeyForReceiver(receiverPublicKey, rawAESKey) {
  const keyBase64 = Buffer.from(rawAESKey).toString('base64');
  const encryptedObject = encrypt({
    publicKey: receiverPublicKey,
    data: keyBase64,
    version: 'x25519-xsalsa20-poly1305',
  });
  return Buffer.from(JSON.stringify(encryptedObject)).toString('base64');
}

// ─── Encrypted-file packing ───────────────────────────────────────────────────
// Layout:  [ 12 bytes IV ][ N bytes AES-GCM ciphertext ]

export function packEncryptedFile(iv, ciphertext) {
  const buf = new Uint8Array(iv.length + ciphertext.byteLength);
  buf.set(iv, 0);
  buf.set(new Uint8Array(ciphertext), iv.length);
  return new Blob([buf], { type: 'application/octet-stream' });
}

export function unpackEncryptedFile(buffer) {
  const arr = new Uint8Array(buffer);
  const iv = arr.slice(0, 12);
  const ciphertext = arr.slice(12).buffer;
  return { iv, ciphertext };
}

// ─── Download helper ──────────────────────────────────────────────────────────

export function triggerDownload(buffer, fileName, mimeType = 'application/octet-stream') {
  const blob = new Blob([buffer], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

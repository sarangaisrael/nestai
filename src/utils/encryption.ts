// AES-GCM 256-bit client-side encryption.
// Key is derived from the user's UUID via PBKDF2 — stable across password resets.
// decryptText gracefully returns plaintext for existing unencrypted rows.

// One derived key per userId, cached for the session lifetime to avoid
// re-running 100k PBKDF2 iterations on every call.
const keyCache = new Map<string, CryptoKey>();

const getEncryptionKey = async (userId: string): Promise<CryptoKey> => {
  if (keyCache.has(userId)) return keyCache.get(userId)!;

  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(userId.replace(/-/g, '').slice(0, 32).padEnd(32, '0')),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('nestai-salt-2025'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  keyCache.set(userId, key);
  return key;
};

export const encryptText = async (text: string, userId: string): Promise<string> => {
  if (!text) return text;
  const key = await getEncryptionKey(userId);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(text);
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  return btoa(String.fromCharCode(...combined));
};

export const decryptText = async (ciphertext: string, userId: string): Promise<string> => {
  if (!ciphertext) return ciphertext;
  try {
    const key = await getEncryptionKey(userId);
    const combined = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encrypted);
    return new TextDecoder().decode(decrypted);
  } catch {
    // Not encrypted (existing plaintext row) — return as-is
    return ciphertext;
  }
};

export const isEncrypted = (text: string): boolean => {
  if (!text || text.length < 20) return false;
  try {
    return atob(text).length > 12;
  } catch {
    return false;
  }
};

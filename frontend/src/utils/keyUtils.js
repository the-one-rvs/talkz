const DB_NAME = "TalkzKeysDB";
const STORE_NAME = "privateKeys";
const DB_VERSION = 2;


import axios from "axios";

const PUBLIC_KEY_STORE = "publicKeys";

// ---------- IndexedDB helpers for public keys ----------
async function storePublicKeyInIndexedDB(userId, publicKeyBase64) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PUBLIC_KEY_STORE, "readwrite");
    const store = tx.objectStore(PUBLIC_KEY_STORE);
    const putReq = store.put({ userId, publicKey: publicKeyBase64 });
    putReq.onsuccess = () => resolve(true);
    putReq.onerror = () => reject(putReq.error);
  });
}

export async function getPublicKeyFromIndexedDB(userId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PUBLIC_KEY_STORE, "readonly");
    const store = tx.objectStore(PUBLIC_KEY_STORE);
    const req = store.get(userId);
    req.onsuccess = () => {
      const rec = req.result;
      resolve(rec ? rec.publicKey : null);
    };
    req.onerror = () => reject(req.error);
  });
}

// Make sure object store exists for public keys
function upgradeDBForPublicKeys(db) {
  if (!db.objectStoreNames.contains(PUBLIC_KEY_STORE)) {
    db.createObjectStore(PUBLIC_KEY_STORE, { keyPath: "userId" });
  }
}

// Overriding openDB to handle multiple stores
export async function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION); // DB_VERSION >= 2 if publicKeys added later

    req.onupgradeneeded = (e) => {
      const db = e.target.result;

      // Ensure privateKeys store exists
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "userId" });
      }

      // Ensure publicKeys store exists
      if (!db.objectStoreNames.contains(PUBLIC_KEY_STORE)) {
        db.createObjectStore(PUBLIC_KEY_STORE, { keyPath: "userId" });
      }
    };

    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = () => reject(req.error);
  });
}


// ---------- Fetch public key from backend API ----------
export async function fetchPublicKey(email, userId) {
  try {
    console.log("🔹 Fetching public key for:", userId);
    const res = await axios.post(
      "/api/v1/keyHandlerService/get-Public-Key",
      { userId }, // POST body
      { withCredentials: true }
    );

    if (res.data?.data) {
      const publicKeyBase64 = res.data.data.publickey; // backend returns base64
      // store in IndexedDB for later
      await storePublicKeyInIndexedDB(userId, publicKeyBase64);
      return publicKeyBase64;
    } else {
      throw new Error("Public key not found");
    }
  } catch (err) {
    console.error("Failed to fetch public key:", err);
    return null;
  }
}

/**
 * Get private key (base64 PKCS8 string) from IndexedDB.
 * Returns string (base64) or null.
 */
export async function getPrivateKeyFromIndexedDB(userId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(userId);
    req.onsuccess = () => {
      const rec = req.result;
      resolve(rec ? rec.privateKey : null);
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Store private key (base64 PKCS8 string) into IndexedDB under userId.
 * Returns true if ok.
 */
export async function storePrivateKeyInIndexedDB(userId, privateKeyBase64) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const putReq = store.put({ userId, privateKey: privateKeyBase64 });
    putReq.onsuccess = () => resolve(true);
    putReq.onerror = () => reject(putReq.error);
  });
}

// ---------- Base64 <-> ArrayBuffer helpers ----------
export function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

export function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

// ---------- RSA keypair generation & export (Base64) ----------
/**
 * Generate RSA-OAEP keypair (4096) and return { publicKey, privateKey } as base64 strings.
 * - publicKey: SPKI base64 (suitable to store in backend)
 * - privateKey: PKCS8 base64 (suitable to store encrypted)
 */
export async function generateRSAKeyPair() {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 4096,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );

  const spki = await crypto.subtle.exportKey("spki", keyPair.publicKey);   // ArrayBuffer
  const pkcs8 = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey); // ArrayBuffer

  //console.log(arrayBufferToBase64(pkcs8))
  return {
    publicKey: arrayBufferToBase64(spki),
    privateKey: arrayBufferToBase64(pkcs8),
  };
}

// ---------- AES key derivation from userId (PBKDF2 -> AES-GCM) ----------
async function deriveAESKeyFromUserId(userId) {
  const enc = new TextEncoder();
  const salt = enc.encode("talkz-salt-v1"); // changeable application salt
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(userId),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

// ---------- Encrypt private key (binary-safe) ----------
// privateKeyBase64: base64 PKCS8 string (what generateRSAKeyPair returns)
export async function encryptPrivateKey(privateKeyBase64, userId) {
  // convert base64 -> ArrayBuffer (binary of PKCS8)
  const plainBuffer = base64ToArrayBuffer(privateKeyBase64); // ArrayBuffer
  const aesKey = await deriveAESKeyFromUserId(userId);
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM

  const cipherBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    plainBuffer
  );

  // store iv + cipher as base64 JSON (so easily storable as string)
  const payload = {
    iv: Array.from(iv),
    data: Array.from(new Uint8Array(cipherBuffer)),
  };
  return btoa(JSON.stringify(payload));
}

// ---------- Decrypt private key (returns base64 PKCS8 string) ----------
export async function decryptPrivateKey(encryptedBase64Payload, userId) {
  const decoded = JSON.parse(atob(encryptedBase64Payload));
  const iv = new Uint8Array(decoded.iv);
  const cipher = new Uint8Array(decoded.data);

  const aesKey = await deriveAESKeyFromUserId(userId);

  const plainBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    aesKey,
    cipher.buffer
  );

  // convert ArrayBuffer -> base64 (PKCS8)
  const privateKeyBase64 = arrayBufferToBase64(plainBuffer);
//   console.log(privateKeyBase64)
  return privateKeyBase64;
}

// ---------- Import helpers (to crypto.subtle CryptoKey) ----------
/**
 * Import a base64 SPKI public key -> CryptoKey usable for RSA-OAEP encrypt.
 * publicKeyBase64: SPKI base64 string
 */
export async function importPublicKeyFromBase64(publicKeyBase64) {
  const ab = base64ToArrayBuffer(publicKeyBase64);
  return crypto.subtle.importKey(
    "spki",
    ab,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["encrypt"]
  );
}

/**
 * Import a base64 PKCS8 private key -> CryptoKey usable for RSA-OAEP decrypt.
 * privateKeyBase64: PKCS8 base64 string
 */
export async function importPrivateKeyFromBase64(privateKeyBase64) {
  const ab = base64ToArrayBuffer(privateKeyBase64);
  return crypto.subtle.importKey(
    "pkcs8",
    ab,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["decrypt"]
  );
}

// ---------- HYBRID AES + RSA MESSAGE ENCRYPTION HELPERS ----------

// Generate a random AES key (256-bit AES-GCM)
export async function generateRandomAESKey() {
  return crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

// Encrypt message using AES-GCM (returns { cipherBase64, iv })
export async function encryptMessageWithAES(aesKey, message) {
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV
  const enc = new TextEncoder();
  const messageData = enc.encode(message);

  const cipherBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    messageData
  );

  return {
    encryptedMessage: arrayBufferToBase64(cipherBuffer),
    iv: Array.from(iv), // store/send easily as JSON
  };
}

// Decrypt message using AES-GCM (expects base64 cipher + iv array)
export async function decryptMessageWithAES(aesKey, encryptedMessage, ivArray) {
  const iv = new Uint8Array(ivArray);
  const cipherBuf = base64ToArrayBuffer(encryptedMessage);

  const plainBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    aesKey,
    cipherBuf
  );

  return new TextDecoder().decode(plainBuffer);
}

// Encrypt AES key with receiver's RSA public key
export async function encryptAESKeyWithPublicKey(aesKey, receiverPublicKeyBase64) {
  const publicKey = await importPublicKeyFromBase64(receiverPublicKeyBase64);
  const rawAesKey = await crypto.subtle.exportKey("raw", aesKey);

  const encryptedAesBuffer = await crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    publicKey,
    rawAesKey
  );

  return arrayBufferToBase64(encryptedAesBuffer);
}

// Decrypt AES key using your RSA private key
export async function decryptAESKeyWithPrivateKey(encryptedAESKeyBase64, privateKeyBase64) {
  const privateKey = await importPrivateKeyFromBase64(privateKeyBase64);
  const encryptedAesBuffer = base64ToArrayBuffer(encryptedAESKeyBase64);

  const rawAesBuffer = await crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    privateKey,
    encryptedAesBuffer
  );

  // Import the decrypted AES key back for usage
  return crypto.subtle.importKey(
    "raw",
    rawAesBuffer,
    { name: "AES-GCM" },
    true,
    ["encrypt", "decrypt"]
  );
}

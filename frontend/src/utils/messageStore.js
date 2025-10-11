// utils/messageStore.js
const DB_NAME = "ChatMessagesDB";
const STORE_NAME = "messages";

export async function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveMessageLocally(userId, receiverId, text, createdAt) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  tx.objectStore(STORE_NAME).add({
    userId,
    receiverId,
    text,
    createdAt,
    from: "me",
  });
  return tx.complete;
}

export async function getMessagesForUser(userId, receiverId) {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => {
      const all = req.result.filter(
        (m) =>
          (m.userId === userId && m.receiverId === receiverId) ||
          (m.userId === receiverId && m.receiverId === userId)
      );
      resolve(all);
    };
  });
}

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import {
  getPrivateKeyFromIndexedDB,
  storePrivateKeyInIndexedDB,
  generateRSAKeyPair,
  encryptPrivateKey,
  decryptPrivateKey,
} from "../utils/keyUtils";

const API_BASE = "/api/v1/keyHandlerService";

// 🔑 Main async logic
export const handleUserKeys = createAsyncThunk(
  "keys/handleUserKeys",
  async (userId, { rejectWithValue }) => {
    try {
      console.log("🔹 handleUserKeys called for:", userId);

      // 1️⃣ Check local IndexedDB
      const localKey = await getPrivateKeyFromIndexedDB(userId);
      if (localKey) {
        console.log("✅ Private key already exists locally");
        return { status: "exists", privateKey: localKey };
      }

      // 2️⃣ Check backend
      const keyExistsRes = await axios.get(`${API_BASE}/check-Keys`, {
        withCredentials: true,
      });

      const keyExists = keyExistsRes?.data?.data;
      console.log("Backend key exists:", keyExists);

      if (keyExists === true) {
        console.log("☁️ Private key found in backend, fetching...");
        const { data } = await axios.get(`${API_BASE}/get-Private-Key`, {
          withCredentials: true,
        });

        const encryptedKey = data?.data?.privatekey;
        if (encryptedKey) {
          const decryptedKey = await decryptPrivateKey(encryptedKey, userId);
          console.log("🔓 Private key decrypted from backend and restored locally");
          await storePrivateKeyInIndexedDB(userId, decryptedKey);
          return { status: "restored", privateKey: decryptedKey };
        }
      }

      // 3️⃣ If no key in backend → generate new pair
      if (keyExists === false) {
        console.log("⚙️ Generating new RSA key pair...");
        const { publicKey, privateKey } = await generateRSAKeyPair();
        const encryptedPrivateKey = await encryptPrivateKey(privateKey, userId);

        await axios.post(
          `${API_BASE}/add-Keys`,
          { publicKey, privateKey: encryptedPrivateKey },
          { withCredentials: true }
        );

        await storePrivateKeyInIndexedDB(userId, privateKey);

        console.log("🆕 New key pair generated and stored");
        return { status: "generated", privateKey };
      }

      throw new Error("Unexpected key state");
    } catch (err) {
      console.error("❌ handleUserKeys error:", err);
      return rejectWithValue(err.response?.data?.message || "Key handling failed");
    }
  }
);

// Slice
const keySlice = createSlice({
  name: "keys",
  initialState: {
    privateKey: null,
/*************  ✨ Windsurf Command ⭐  *************/
/**
 * Resets the error state of the keySlice to null.
 */
/*******  37f64ab5-271f-4164-a965-8ba4fbcf9d9d  *******/    status: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearKeyError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(handleUserKeys.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(handleUserKeys.fulfilled, (state, action) => {
        state.loading = false;
        state.privateKey = action.payload.privateKey;
        state.status = action.payload.status;
      })
      .addCase(handleUserKeys.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearKeyError } = keySlice.actions;
export default keySlice.reducer;

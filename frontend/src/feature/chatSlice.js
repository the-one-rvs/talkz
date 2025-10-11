// feature/chatSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE = "/api/v1";
const GRAPHQL_API = "/api/v1/getUserService/graphql";

// --- Fetch all users (GraphQL) ---
export const fetchAllUsers = createAsyncThunk(
  "chat/fetchAllUsers",
  async (_, { rejectWithValue }) => {
    try {
      const query = `
        query {
          allUsers {
            _id
            username
            fullname
          }
        }
      `;
      const res = await axios.post(GRAPHQL_API, { query }, { withCredentials: true });
      if (res.data.errors) return rejectWithValue(res.data.errors[0].message);
      return res.data.data.allUsers;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch users");
    }
  }
);

// --- Check if user is online ---
// --- Check if user is online ---
export const fetchUserOnlineStatus = createAsyncThunk(
  "chat/fetchUserOnlineStatus",
  async (userId, { rejectWithValue }) => {
    try {
      const res = await axios.get(
        `${API_BASE}/chatService/api/online/${userId}`,
        { withCredentials: true }
      );

      // Backend se jo aaya uske basis pe isOnline set karo
      return { userId, isOnline: res.data.data === true };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch online status"
      );
    }
  }
);

// --- Chat Slice ---
const chatSlice = createSlice({
  name: "chat",
  initialState: {
    users: [], // { _id, username, fullname, isOnline }
    messages: {}, // { [userId]: [{ from, text, encryptedMessage?, iv?, aesKeyEncrypted? }] }
    loading: false,
    error: null,
    socket: null,
  },
  reducers: {
    setSocket: (state, action) => {
      state.socket = action.payload;
    },
    addMessage: (state, action) => {
      const { toUserId, message } = action.payload;
      if (!state.messages[toUserId]) state.messages[toUserId] = [];
      state.messages[toUserId].push(message);
    },
    setUserOnlineStatus: (state, action) => {
      const { userId, isOnline } = action.payload;
      const user = state.users.find(u => u._id === userId);
      if (user) user.isOnline = isOnline;
    },
    clearError: (state) => { state.error = null; }
  },
  extraReducers: (builder) => {
    builder
      // Fetch all users
      .addCase(fetchAllUsers.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchAllUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload.map(u => ({ ...u, isOnline: false }));
      })
      .addCase(fetchAllUsers.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      // Fetch user online status
      .addCase(fetchUserOnlineStatus.fulfilled, (state, action) => {
        const { userId, isOnline } = action.payload;
        const user = state.users.find(u => u._id === userId);
        if (user) user.isOnline = isOnline;
      })
      .addCase(fetchUserOnlineStatus.rejected, (state, action) => { state.error = action.payload; });
  }
});

export const { setSocket, addMessage, setUserOnlineStatus, clearError } = chatSlice.actions;
export default chatSlice.reducer;

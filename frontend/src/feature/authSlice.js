import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE = "/api/v1";
const GRAPHQL_API = "/api/v1/getUserService/graphql";

// --- Email/password login ---
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (credentials, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${API_BASE}/loginService/login`, credentials, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });
      return res.data.data.user;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Login failed. Please try again."
      );
    }
  }
);

// --- Google OAuth login ---
export const loginWithGoogle = createAsyncThunk(
  "auth/loginWithGoogle",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_BASE}/oAuthService/google`, {
        withCredentials: true,
      });
      return res.data.data.user;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Google login failed."
      );
    }
  }
);

// --- Fetch Current User (GraphQL) ---
export const fetchCurrentUser = createAsyncThunk(
  "auth/fetchCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
      const query = `
        query {
          currentUser {
            _id
            username
            email
            fullname
            onlyOAuth
            isVerified
          }
        }
      `;

      const res = await axios.post(
        GRAPHQL_API,
        { query },
        { withCredentials: true }
      );

      if (res.data.errors) {
        return rejectWithValue(res.data.errors[0].message);
      }

      return res.data.data.currentUser;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch user"
      );
    }
  }
);

// --- Logout User ---
export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_BASE}/logoutService/logout`, {}, {
        withCredentials: true,
      });
      return res.data.message || "Logged out successfully";
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Logout failed. Please try again."
      );
    }
  }
);

export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async (userData, { rejectWithValue }) => {
    try {
      const res = await axios.post(
        `${API_BASE}/registerService/register-user`,
        userData,
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );
      return res.data.user;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Registration failed. Please try again."
      );
    }
  }
);

// --- Resend Verification Email ---
export const resendVerificationEmail = createAsyncThunk(
  "auth/resend-email",
  async (email, { rejectWithValue }) => {
    try {
      const res = await axios.post(
        `${API_BASE}/registerService/resend-verification-mail`,
        { email },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );
      return res.data.message || "Verification email sent!";
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to send verification email"
      );
    }
  }
);

// --- Update Account ---
export const updateAccountInfo = createAsyncThunk(
  "auth/updateAccountInfo",
  async (userData, { rejectWithValue }) => {
    try {
      const res = await axios.patch(
        `${API_BASE}/updateService/update-info`,
        userData,
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );
      return res.data.user || res.data.message;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Update failed. Please try again."
      );
    }
  }
);

// --- Change Password ---
export const changePassword = createAsyncThunk(
  "auth/changePassword",
  async (passwordData, { rejectWithValue }) => {
    try {
      const res = await axios.post(
        `${API_BASE}/updateService/change-password`,
        passwordData,
        { headers: { "Content-Type": "application/json" }, withCredentials: true }
      );
      return res.data.message || "Password changed successfully!";
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Password change failed");
    }
  }
);


// --- OAuth Add Password ---
export const addPassword = createAsyncThunk(
  "auth/addPassword",
  async ({ userId, password }, { rejectWithValue }) => {
    try {
      const res = await axios.post(
        `/api/v1/oAuthService/add-password/${userId}`,
        { password },
        { headers: { "Content-Type": "application/json" }, withCredentials: true }
      );
      return res.data.message || "Password added successfully!";
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Adding password failed");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    loading: false,
    error: null,
    successMessage: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Email login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Google login
      .addCase(loginWithGoogle.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginWithGoogle.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(loginWithGoogle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch current user
      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Change Password
      .addCase(changePassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = action.payload;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- OAuth Add Password ---
      .addCase(addPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addPassword.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = action.payload;
      })
      .addCase(addPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })


      // Logout
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(logoutUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = null;
        state.successMessage = action.payload;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(resendVerificationEmail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resendVerificationEmail.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = action.payload;
      })
      .addCase(resendVerificationEmail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateAccountInfo.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(updateAccountInfo.fulfilled, (state, action) => {
        state.loading = false;
        // Agar API user object return kare to update karo
        if (typeof action.payload === "object") {
          state.user = action.payload;
          state.successMessage = "Account updated successfully!";
        } else {
          state.successMessage = action.payload;
        }
      })
      .addCase(updateAccountInfo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearSuccess } = authSlice.actions;
export default authSlice.reducer;

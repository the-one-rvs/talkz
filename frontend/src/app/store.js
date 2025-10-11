import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../feature/authSlice";
import chatReducer from "../feature/chatSlice";
import keyReducer from "../feature/keySlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    chat: chatReducer,
    key: keyReducer
  },
});

export default store;

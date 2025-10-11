import jwt from "jsonwebtoken";
import cookie from "cookie";
import { ApiError } from "../utils/ApiError.js";

export const authHandler = (socket, next) => {
  try {
    // Parse cookies from the socket handshake headers
    const cookies = cookie.parse(socket.request.headers.cookie || "");
    const token = cookies.accessToken; // 👈 cookie name must match what backend sets

    // console.log("🔑 Cookie Token:", token);

    if (!token) {
      throw new ApiError(400, "Unauthorized request — no token found in cookies");
    }

    // Verify JWT
    const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    socket.user = payload;

    next();
  } catch (err) {
    console.error("❌ Socket Auth Error:", err.message);
    next(new ApiError(400, "Unauthorized request"));
  }
};

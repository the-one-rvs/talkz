import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";

export const authHandler = (socket, next) => {
  const token = socket.handshake.auth?.token;
  console.log(token)

  if (!token) {
    throw new ApiError(400, "Unauthorized request");
  }

  try {
    const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    socket.user = payload; 
    next();
  } catch (err) {
    throw new ApiError(400, err?.message)
  }
};

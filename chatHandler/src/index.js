import dotenv from "dotenv";
dotenv.config();

import express from "express";
import http from "http";
import { Server } from "socket.io";
import { chatSocket } from "./socket/chathandler.js";
import { authHandler } from "./middleware/auth.middleware.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Adjust in production
    methods: ["GET", "POST"]
  }
});

// Socket.IO middleware for auth
io.use(authHandler);

// Register chat logic
io.on("connection", (socket) => {
  chatSocket(socket, io);
});

server.listen(process.env.PORT, () => {
  console.log("Chat Service running on port", process.env.PORT);
});

import dotenv from "dotenv";
dotenv.config();

import express from "express";
import http from "http";
import { Server } from "socket.io";
import { chatSocket } from "./socket/chathandler.js";
import { authHandler } from "./middleware/auth.middleware.js";
import  connectDB  from "./db/connectDB.js"; // assuming this exists
import onlineStatusRoutes from "./routes/onlineStatus.route.js";
import messageRoutes from "./routes/message.route.js"
import { connectRabbitMQ } from "./queues/publisher.js";

await connectRabbitMQ()

const app = express();


app.use("/api/online", onlineStatusRoutes);
app.use("/", messageRoutes)

connectDB().then(() => {
  const server = http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin: "*", // Change this to specific origin in prod
      methods: ["GET", "POST"]
    }
  });

  //  JWT Auth Middleware
  io.use(authHandler);

  //  Register Chat Socket Logic
  io.on("connection", (socket) => {
    console.log("New connection:", socket.user?._id);
    chatSocket(socket, io);
  });

  // Start Server
  server.listen(process.env.PORT, () => {
    console.log("Chat Service running on port", process.env.PORT);
  });
}).catch((err) => {
  console.error("DB connection failed:", err);
});

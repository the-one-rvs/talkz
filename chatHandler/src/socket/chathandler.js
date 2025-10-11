import { Message } from "../model/message.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  addOnlineUser,
  removeOnlineUser,
  getSocketIdByUserId
} from "../utils/onlineUser.js";

export const chatSocket = asyncHandler(async (socket, io) => {
  const userId = socket.user._id;
  console.log(`✅ User connected: ${userId}, Socket: ${socket.id}`);

  // Add user to online list
  addOnlineUser(userId, socket.id);

  // 1️⃣ Send all undelivered messages only once
  const undeliveredMessages = await Message.find({
    receiverId: userId,
    delivered: false,
  });

  if (undeliveredMessages.length > 0) {
    console.log(`📨 Delivering ${undeliveredMessages.length} pending messages to ${userId}`);
  }

  for (const msg of undeliveredMessages) {
    socket.emit("receive-message", {
      from: msg.senderId,
      encryptedMessage: msg.encryptedMessage,
      encryptedAESKey: msg.encryptedAESKey,
      iv: msg.iv,
      createdAt: msg.createdAt, // 👈 include timestamp for frontend sorting
    });

    // mark delivered = true
    msg.delivered = true;
    await msg.save();
  }

  // 2️⃣ Handle "send-message" event
  socket.on("send-message", async ({ to, encryptedMessage, encryptedAESKey, iv, createdAt }) => {
    try {
      console.log("🧾 Incoming send-message:", { from: userId, to });

      // Save message in DB
      const messageDoc = await Message.create({
        senderId: userId,
        receiverId: to,
        encryptedMessage,
        encryptedAESKey,
        iv,
        delivered: false,
        createdAt: createdAt || new Date(), // 👈 sync timestamp if frontend sends one
      });

      console.log(`💾 Message stored in DB: ${messageDoc._id}`);

      // Check if receiver is online
      const receiverSocketId = getSocketIdByUserId(to);
      if (receiverSocketId) {
        console.log(`📡 Receiver ${to} online — delivering instantly`);
        io.to(receiverSocketId).emit("receive-message", {
          from: userId,
          encryptedMessage,
          encryptedAESKey,
          iv,
          createdAt: messageDoc.createdAt,
        });

        // Update delivered flag immediately
        messageDoc.delivered = true;
        await messageDoc.save();
      } else {
        console.log(`📦 Receiver ${to} offline — stored for later`);
      }
    } catch (err) {
      console.error("❌ Error saving/sending message:", err);
    }
  });

  // 3️⃣ Handle disconnect
  socket.on("disconnect", () => {
    removeOnlineUser(socket.id);
    console.log(`❌ User ${userId} disconnected`);
  });
});

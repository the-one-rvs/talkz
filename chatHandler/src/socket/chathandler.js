import { Message } from "../model/message.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  addOnlineUser,
  removeOnlineUser,
  getSocketIdByUserId
} from "../utils/onlineUsers.js";

export const chatSocket = asyncHandler(async(socket, io) => {
  const userId = socket.user._id;

  addOnlineUser(userId, socket.id);

  const undeliveredMessages = await Message.find({
    receiverId: userId,
    delivered: false,
  });

  undeliveredMessages.forEach(async (msg) => {
    socket.emit("receive-message", {
      from: msg.senderId,
      encryptedMessage: msg.encryptedMessage,
      encryptedAESKey: msg.encryptedAESKey,
      iv: msg.iv,
    });

    // Mark message as delivered
    msg.delivered = true;
    await msg.save();
  });
  
  socket.on("send-message", async ({ to, encryptedMessage, encryptedAESKey, iv }) => {
    const receiverSocketId = getSocketIdByUserId(to);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("receive-message", {
        from: socket.user._id,
        encryptedMessage,
        encryptedAESKey,
        iv,
      });
    } else {
      await Message.create({
        senderId: socket.user._id,
        receiverId: to,
        encryptedMessage,
        encryptedAESKey,
        iv,
        delivered: false,
      });
    }
  });


  socket.on("disconnect", () => {
    removeOnlineUser(socket.id);
    console.log(`User ${userId} disconnected`);
  });
});

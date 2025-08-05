import { asyncHandler } from "../utils/asyncHandler.js";
import {
  addOnlineUser,
  removeOnlineUser,
  getSocketIdByUserId
} from "../utils/onlineUsers.js";

export const chatSocket = asyncHandler(async(socket, io) => {
  const userId = socket.user._id;

  addOnlineUser(userId, socket.id);

  await socket.on("send-message", ({ to, encryptedMessage, encryptedAESKey, iv }) => {
    const receiverSocketId = getSocketIdByUserId(to);
    if (receiverSocketId) {
        io.to(receiverSocketId).emit("receive-message", {
            from: socket.user._id,
            encryptedMessage,
            encryptedAESKey,
            iv
        });
    }
    });


  socket.on("disconnect", () => {
    removeOnlineUser(socket.id);
    console.log(`User ${userId} disconnected`);
  });
});

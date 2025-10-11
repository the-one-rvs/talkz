// utils/onlineUsers.js
const onlineUsers = new Map(); // userId -> socketId

export const addOnlineUser = (userId, socketId) => {
  onlineUsers.set(userId.toString(), socketId);
};

export const removeOnlineUser = (socketId) => {
  for (let [userId, sId] of onlineUsers.entries()) {
    if (sId === socketId) {
      onlineUsers.delete(userId);
      break;
    }
  }
};

export const getSocketIdByUserId = (userId) => {
  return onlineUsers.get(userId.toString());
};

export const isUserOnline = (userId) => {
  return onlineUsers.has(userId.toString());
};

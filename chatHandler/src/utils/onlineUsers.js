const onlineUsers = new Map(); // userId -> socketId

export const addOnlineUser = (userId, socketId) => {
  onlineUsers.set(userId, socketId);
};

export const removeOnlineUser = (socketId) => {
  for (const [userId, id] of onlineUsers.entries()) {
    if (id === socketId) {
      onlineUsers.delete(userId);
      break;
    }
  }
};

export const getSocketIdByUserId = (userId) => {
  return onlineUsers.get(userId);
};

export const getOnlineUsers = () => {
  return Array.from(onlineUsers.keys());
};

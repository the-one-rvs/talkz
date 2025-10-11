import { ApiResponse } from "../../../login/src/utils/ApiResponse.js";
import { Message } from "../model/message.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";


const getMessages = asyncHandler(async (req, res) => {
  const { senderId } = req.params; // logged-in user
  const { receiverId } = req.params;

  // 📨 Find all messages where either:
  // (you → them)
  const messages = await Message.find({ senderId: senderId, receiverId: receiverId }).sort({ createdAt: 1 }) .lean(); 

  return res.status(200).json(new ApiResponse(200, messages, "Messages Fetched Successfully"));
});

export { getMessages };

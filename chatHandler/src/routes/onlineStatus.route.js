import express from "express";
import { isUserOnline } from "../utils/onlineUser.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const router = express.Router();

// GET /online/:userId
router.get("/:userId", (req, res) => {
  const userId = req.params.userId;
  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }
  const online = isUserOnline(userId);
  // res.json({ userId, isOnline: online });
  return res.json(new ApiResponse(200, online, "Online Status Fetched Successfully"))
});

export default router;

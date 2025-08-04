import redis from "../utils/redisClient.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../model/user.model.js";

const logout = asyncHandler (async (req, res) => {
    const userId = req.headers["x-user-id"];
    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }

    const user = await User.findById(userId);

    user.refreshToken = undefined
    await user.save({ validateBeforeSave: false });

    await redis.del(`user:${user._id}:profile`);
    
    return res
    .status(200)
    .json(new ApiResponse(200, {}, "User logged out successfully"))
})

export {logout}
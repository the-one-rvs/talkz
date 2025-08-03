import redis from "../utils/redisClient.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const logout = asyncHandler (async (req, res) => {
    const user = req.body.user
    if (!user){
        throw new ApiError(400, "Unauth Request");
    }
    console.log(user)
    user.refreshToken = undefined
    await user.save({ validateBeforeSave: false });

    await redis.del(`user:${user._id}:profile`);
    
    return res
    .status(200)
    .json(new ApiResponse(200, {}, "User logged out successfully"))
})

export {logout}
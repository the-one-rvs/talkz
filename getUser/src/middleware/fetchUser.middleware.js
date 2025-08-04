import { User } from "../model/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const fetchUser = asyncHandler(async(req, res, next) => {
    const userId = req.headers["x-user-id"];
    if (!userId) {
        throw new ApiError(401, "Unauthorized Request ....");
    }
    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(401, "User not found");
    }
    req.user = user;
    next()
})
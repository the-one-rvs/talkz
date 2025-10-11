import { User } from "../model/user.model.js";
import redis from "../utils/redisClient.js";

export const fetchUser = async (req, res, next) => {
    try {
        const user_id = req.headers["x-user-id"];
        const key = `user:${user_id}:profile`;
        const cached = await redis.get(key);
        if (cached){ 
            req.user = JSON.parse(cached);  // parse back to object
            return next(); // return ensures function stops here
        }

        const user = await User.findById(user_id).select("-password -refreshToken");
        if (!user) throw new ApiError(404, "User not found");

        req.user = user;
        next();
    } catch (err) {
        next(err);
    }
}

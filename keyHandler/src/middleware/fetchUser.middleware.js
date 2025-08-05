import { User } from "../model/user.model.js";

export const fetchUser = async (req, res, next) => {
    const user_id = req.headers["x-user-id"];
    const key = `user:${user_id}:profile`;
    const cached = await redis.get(key);
    if (cached){ 
        req.user = cached
        next()
    }
    const user = await User.findById(user_id).select("-password -refreshToken")
    req.user = user
    next()
}
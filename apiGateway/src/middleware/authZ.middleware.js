import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../model/user.model.js"
import { mongoOP } from "../metrics.js";

export const verifyJWT = asyncHandler(async(req, _, next) => {
    try {
        // console.log("🧩 verifyJWT called for:", req.originalUrl);
        // console.log("Cookies available:", req.cookies);
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
    
        if (!token) {
            throw new ApiError(401, "Unauthorized request")
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        
        // console.log(decodedToken)
        const op = mongoOP.startTimer({operation: "find_user_from_token", type: "findById"})
        const user = await User.findById(decodedToken._id).select(" -password ")
        op()

        if (!user) {
            throw new ApiError(401, "Invalid Access Token")
        }
    
        req.user = user;
        next()
    } catch (error) {
        throw new ApiError (401, error?.message || "Invalid Access Token")
    }
})
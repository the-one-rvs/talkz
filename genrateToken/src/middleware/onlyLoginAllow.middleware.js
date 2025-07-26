import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const checkLoginService = asyncHandler(async (req,res, next) => {
    try {
        const serviceSecret = req.headers['x-login-service-secret'];
        if (!(serviceSecret && serviceSecret === process.env.TOKEN_SERVICE_SECRET)) {
            throw new ApiError(400, "Request is not from login service")
        }
        return next();
    
    } catch (error) {
        throw new ApiError(400, error?.message)
    }}
)

export {checkLoginService}
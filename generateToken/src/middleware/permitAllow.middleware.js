import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

const checkPermitedService = asyncHandler(async (req,res, next) => {
    try {
        const serviceSecret = req.headers['x-service-secret'];
        
        const decodedToken = jwt.verify(serviceSecret, process.env.TOKEN_SERVICE_SECRET)

        if (!(decodedToken.service == "login" || decodedToken.service == "oAuth")) {
            throw new ApiError(400, "Request is not from login service")
        }
        return next();
    
    } catch (error) {
        throw new ApiError(400, error?.message)
    }}
)

export {checkPermitedService}
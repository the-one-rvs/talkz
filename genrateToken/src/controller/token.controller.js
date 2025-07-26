import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import redis from "../utils/redisClient.js";

const genratetokens = asyncHandler(async (req,res) => {
    try {
        const { userId, username, email, fullname } = req.body
        if (!userId && !username && !email && !fullname){
            throw new ApiError(400, "Please pass all required fields")
        }
        const accessToken = jwt.sign(
            {
                _id: userId,
                email: email,
                username: username,
                fullName: fullname,
            },
            process.env.ACCESS_TOKEN_SECRET,
            {
                expiresIn: process.env.ACCESS_TOKEN_EXPIRY
            }
        )
        const refreshToken = jwt.sign(
            {
                _id: userId,
                
            },
            process.env.REFRESH_TOKEN_SECRET,
            {
                expiresIn: process.env.REFRESH_TOKEN_EXPIRY
            }
        )
        return res.status(200).json( new ApiResponse(200,{
            refreshToken: refreshToken,
            accessToken: accessToken
        }, "Tokens genrated Successfully"))
    } catch (error) {
        throw new ApiError(400, error?.message)
    }
})

export {genratetokens}
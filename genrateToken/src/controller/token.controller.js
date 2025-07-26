import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import redis from "../utils/redisClient.js";
import mongoose from "mongoose";

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

const reclaimTokens = asyncHandler(async (req,res) => {
    const refreshToken = req.user.refreshToken
    if (! refreshToken){
        throw new ApiError(400, "Refresh Token is not in user request")
    }
    const user = await mongoose.connection.db.collection("users").findOne({
        refreshToken: refreshToken
    });
    if (user._id!==req.user._id) {
        throw new ApiError(400, "Something fishy token not found for logged in user")
    }
    if (!user) {
        throw new ApiError(400, "Refresh Token not found in user collection");
    }
    const accessToken = jwt.sign(
        {
            _id: req.user._id,
            email: req.user.email,
            username: req.user.username,
            fullName: req.user.fullname,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
    return res.status(200).json(new ApiResponse (200, {accessToken}, "Access Token Refreshed"))
})

export {
    genratetokens
    ,reclaimTokens
}
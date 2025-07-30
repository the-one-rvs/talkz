import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { accessTokenCreateCounter, reclaimTokenCreationDuration, refreshTokenCreateCounter, tokenCreationDuration } from "../metrics.js";
import { User } from "../model/user.model.js";

const genratetokens = asyncHandler(async (req,res) => {
    try {
        const { userId, username, email, fullname } = req.body
        if (!userId && !username && !email && !fullname){
            throw new ApiError(400, "Please pass all required fields")
        }
        const op = tokenCreationDuration.startTimer()
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
        op()
        accessTokenCreateCounter.inc()
        refreshTokenCreateCounter.inc()
        return res.status(200).json( new ApiResponse(200,{
            refreshToken: refreshToken,
            accessToken: accessToken
        }, "Tokens genrated Successfully"))
    } catch (error) {
        throw new ApiError(400, error?.message)
    }
})

const reclaimTokens = asyncHandler(async (req,res) => {
    // console.log(req.cookies)
    try {
        const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
        
        if (!incomingRefreshToken){
            throw new ApiError(401, "Unauth Request")
        }
    
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id)
    
        if (!user){
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "Refresh Token is expired or used")
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const accessToken = jwt.sign(
            {
                _id: decodedToken._id,
                email: decodedToken.email,
                username: decodedToken.username,
                fullName: decodedToken.fullname,
            },
            process.env.ACCESS_TOKEN_SECRET,
            {
                expiresIn: process.env.ACCESS_TOKEN_EXPIRY
            }
        )
        const newRefreshToken = jwt.sign(
            {
                _id: decodedToken._id,
                
            },
            process.env.REFRESH_TOKEN_SECRET,
            {
                expiresIn: process.env.REFRESH_TOKEN_EXPIRY
            }
        )
        user.refreshToken = newRefreshToken;
        await user.save({ validateBeforeSave: false });

        res.setHeader("x-access-token", accessToken);
        res.setHeader("x-refresh-token", newRefreshToken);
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {accessToken, refreshToken: newRefreshToken},
                "Access Token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message|| "Invalid Refresh Token")
    }
}
)

export {
    genratetokens
    ,reclaimTokens
}
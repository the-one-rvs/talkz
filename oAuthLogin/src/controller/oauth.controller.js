import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../model/user.model.js";
import { oauthduration, oauthTokenCreation } from "../metrics.js";

const tokens = asyncHandler( async (req, res) => {
    const op2 = oauthduration.startTimer({OperationType: "Token Genration"})
    const user = req.user;
    const headerToken = jwt.sign({
        service: "oAuth"
        
    },process.env.TOKEN_SERVICE_SECRET,
    {
        expiresIn: process.env.TOKEN_EXPIRY
    })
    const tokenRes = await axios.post(process.env.TOKEN_IP, {
        userId: user._id,
        username: user.username,
        email: user.email,
        fullname: user.fullname
        },
        {
            headers: {
                'x-oAuth-service-secret': headerToken
            }
        }
    );
    if (!tokenRes){
        throw new ApiError(400, "Something fishy in token response")
    }
    const { accessToken, refreshToken } = tokenRes.data.data;
    user.refreshToken = refreshToken
    const op = mongoOP.startTimer({operation: "save_refresh_token", type: "save"})
    await user.save({validateBeforeSave: false})
    op()
    op2()
    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse( 200, 
    {
        loggedInUser,
        refreshToken,
        accessToken
    },
     "Login successful" ));
})

export {tokens}
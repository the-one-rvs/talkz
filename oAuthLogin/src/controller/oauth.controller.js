import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../model/user.model.js";
import { oauthduration, oauthTokenCreation, mongoOP } from "../metrics.js";
import axios from "axios";

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
                'x-service-secret': headerToken
            }
        }
    );
    if (!tokenRes){
        throw new ApiError(400, "Something fishy in token response")
    }
    oauthTokenCreation.inc()
    const { accessToken, refreshToken } = tokenRes.data.data;
    user.refreshToken = refreshToken
    const op = mongoOP.startTimer({operation: "save_refresh_token", type: "save"})
    await user.save({validateBeforeSave: false})
    op()
    op2()
    const op3 = mongoOP.startTimer({operation: "get_the_looged_in_user", type:"findById"});
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    if (!loggedInUser){
        throw new (400, "oAuth User not saved in DataBase")
    }
    op3()
    res.setHeader("x-access-token", accessToken)
    res.setHeader("x-refresh-token", refreshToken)
    return res.status(200)
    .json(new ApiResponse( 200, 
    {
        loggedInUser
    },
     "Login successful from oAuth" ));
})

export {tokens}
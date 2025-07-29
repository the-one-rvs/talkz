import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../model/user.model.js"
import { loginDurationSeconds, loginSuccessCounter, mongoOP, tokenResponseDuration } from "../metrics.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import axios from "axios";
import redis from "../utils/redisClient.js";


const loginController = asyncHandler(async (req, res) => {
    try {
       const {username, email, password} = req.body 
       const op3 = loginDurationSeconds.startTimer()
       if (!username && !email){
        throw new ApiError (400, "Give atleast username or email")
       } 
       if (!password){
        throw new ApiError (400, "Password Required !!")
       }
       const op = mongoOP.startTimer({operation : "find_user", type: "findOne"});
       const user = await User.findOne({
        $or: [{username}, {email}]
       })
       //    console.log(`${user}`)
       op()
       if (!user){
        throw new ApiError(400, "User not exsists")
       }
       const isPassCorrect = user.isPasswordCorrect(password)
       if (!isPassCorrect) {
        throw new ApiError(400, "Password not matches Try Again!")
       }
       const op4 = tokenResponseDuration.startTimer()
       const tokenRes = await axios.post(process.env.TOKEN_IP, {
            userId: user._id,
            username: user.username,
            email: user.email,
            fullname: user.fullname
            },
            {
                headers: {
                    'x-login-service-secret': process.env.TOKEN_SERVICE_SECRET
                }
            }
        );
        op4()
        if (!tokenRes){
            throw new ApiError(400, "Something fishy in token response")
        }
        const { accessToken, refreshToken } = tokenRes.data.data;
        user.refreshToken = refreshToken
        const op5 = mongoOP.startTimer({operation: "save_refresh_token", type: "save"})
        await user.save({validateBeforeSave: false})
        op5()
        const op2 = mongoOP.startTimer({operation: "looged_in_user", type: "findById"})
        const loggedUser = await User.findById(user._id).select("-password -refreshToken")
        op2()
        if (!loggedUser){
            throw new ApiError(400, "Something is Fishy Can't find logged in User")
        }
        await redis.set(`user:${loggedUser._id}:profile`, JSON.stringify(loggedUser), "EX", 3600);
        op3()
        loginSuccessCounter.inc()
        res.setHeader("x-access-token", accessToken)
        res.setHeader("x-refresh-token", refreshToken)
        return res.status(200)
        .json( new ApiResponse(200,{
            user: loggedUser,
            accessToken,
            refreshToken
        }, "User Logged In Sucessfully"))
    } catch (error) {
        throw new ApiError (400, error?.message)
    }
})

export { loginController }
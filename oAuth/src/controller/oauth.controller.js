import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../model/user.model.js";
import { oauthduration, oauthTokenCreation, mongoOP } from "../metrics.js";
import axios from "axios";
import { checkPass } from "../utils/validator.js";
import { ApiError } from "../utils/ApiError.js";

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
    user.isVerified = true
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
    const html = `<!doctype html>
    <html>
    <head><meta charset="utf-8"><title>Success</title></head>
    <body>
        <script>
        try {
            if (window.opener && !window.opener.closed) {
            // Redirect parent and then close popup
            window.opener.location.href = 'http://localhost:5173/chat';
            window.close();
            } else {
            // If no opener, navigate in this window
            window.location.href = 'http://localhost:5173/chat';
            }
        } catch (e) {
            // window.location.href = 'http://localhost:5173/chat';
            console.log(e)
        }
        </script>
    </body>
    </html>`;

    if (!html){
        throw new ApiError(400, "Redirect failed")
    }
    res.setHeader("x-access-token", accessToken)
    res.setHeader("x-refresh-token", refreshToken)
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
      path: "/",
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
      path: "/",
    });
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(html);
    // return res.status(200).json(new ApiResponse(200, "Success", loggedInUser));
})

const addPassword = asyncHandler(async (req, res) => {
    const {password} = req.body;
    const userId = req.params.userId
    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }
    if (!checkPass(password)){
        throw new ApiError(400, "Password must have a size of 6 and must have 1 special character, 1 Capital Letter, 1 Number")
    }

    const op1 = mongoOP.startTimer({operation: "find_oAuth_user", type:"findByTd"})
    const user = await User.findById(userId);
    op1()
    if (!user){
        throw new ApiError(400, "User not found")
    }

    if (user.onlyOAuth==false){
        throw new ApiError(400, "Sorry But Acount already have a password")
    }

    user.password = password; 
    user.onlyOAuth = false;

    const op = mongoOP.startTimer({ operation: "add_password", type: "save" });
    await user.save();
    op();

    return res.status(200).json(
        new ApiResponse(200, null, "Password added successfully")
    );
})

export {tokens, addPassword}
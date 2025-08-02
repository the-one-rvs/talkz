import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../model/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { mongoOP, registerDurationSeconds, registerSuccessCounter } from "../metrics.js";
import redis from "../utils/redisClient.js";
import { sendVerificationEmail } from "../utils/sendEmail.js";
import jwt from "jsonwebtoken";

const registerUser = asyncHandler(async (req,res) => {
    const {username, email, fullname, password} = req.body;
    const op4 = registerDurationSeconds.startTimer();
    if (!username && !email && !fullname && !password){
        throw new ApiError(400, "All fields are required !!!");
    }
    const op = mongoOP.startTimer({operation : "find_existing_user", type: "findOne"});
    const existingUser = await User.findOne({
        $or: [{ username }, { email }]
    }
    )
    op();
    if (existingUser){
        throw new ApiError(400, "User Already Exsist !!!")
    }
    const op1 = mongoOP.startTimer({operation : "creating_user", type: "create"})
    const user = await User.create({
        username: username,
        fullname: fullname,
        email: email,
        password: password,
        isVerified: false
    })
    op1()
    const token = jwt.sign(email, process.env.JWT_EMAIL_SECRET, { expiresIn: "1h" });
    sendVerificationEmail(email, token)
    const op3 = mongoOP.startTimer({operation : "find_created_user", type: "findById"});
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    op3();
    op4();
    registerSuccessCounter.inc();
    await redis.set(`user:${createdUser._id}:profile`, JSON.stringify(createdUser), "EX", 3600);
    return res.status(200).json(new ApiResponse(200, createdUser, "User Created !! Verify Email..."))
})

const verifyEmail = asyncHandler(async (req,res) => {
  const { token } = req.query;

  try {
    const decoded = jwt.verify(token, process.env.JWT_EMAIL_SECRET);
    const op = mongoOP.startTimer({operation: "search_for_user_needs_to_be_verified", type:"findOne"})
    const user = await User.findOne({ email: decoded.email });
    op()
    if (!user) {
        throw new ApiError(400, "User not found with the email")
    }

    if (user.isVerified) {
        return res.status(200).json( new ApiResponse(200,{},"User Already Verified"))
    }
    const op2 = mongoOP.startTimer({operation: "user_verification_save", type:"save"});
    user.isVerified = true;
    await user.save();
    op2()
    return res.status(200).json(new ApiResponse(200,{},"User Verified"))
  } catch (err) {
    throw new ApiError(400, err?.message)
  }
})

const resendVerificationMail = asyncHandler(async (req,res) => {
    try{
        const {email} = req.body
        const op = mongoOP.startTimer({operation: "search_for_user_if_exsist", type: "findOne"})
        const user = await User.findOne({email: email})
        if (!user){
            throw new ApiError(400, "User is not found for the email")
        }
        op();
        const token = jwt.sign(email, process.env.JWT_EMAIL_SECRET, { expiresIn: "1h" });
        sendVerificationEmail(email,token)
        return res.status(200).json(new ApiResponse(200, {}, "Email Sent..."))
    }
    catch(error){
        new ApiError(400, error?.message)
    }
})

export { 
    registerUser,
    verifyEmail,
    resendVerificationMail
 }
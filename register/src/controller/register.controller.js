import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../model/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { mongoOP, registerDurationSeconds, registerSuccessCounter } from "../metrics.js";
import redis from "../utils/redisClient.js";

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
        password: password
    })
    op1()
    const op3 = mongoOP.startTimer({operation : "find_created_user", type: "findById"});
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    op3();
    registerSuccessCounter.inc();
    op4();
    await redis.set(`user:${createdUser._id}:profile`, JSON.stringify(createdUser), "EX", 3600);
    return res.status(200).json(new ApiResponse(200, createdUser, "User Created !!"))
})

export { registerUser }
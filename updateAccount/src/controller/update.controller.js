import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../model/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { changePasswordCounter, mongoOP, updateAccCounter } from "../metrics.js";
import redis from "../utils/redisClient.js";
import { checkPass } from "../utils/validator.js";

const changePass = asyncHandler ( async (req, res) => {
    try {
        const {oldPassword, newPassword} = req.body;

        if (!oldPassword && !newPassword){
            throw new ApiError(400, "Please Provide all feilds")
        }

        if (!checkPass(newPassword)){
            throw new ApiError(
                400,
                "Password must be at least 6 characters long, include one capital letter, one number, and a letter and one special character."
            );
        }

        const userId = req.headers["x-user-id"];
        if (!userId) {
            throw new ApiError(401, "Unauthorized");
        }

        const op = mongoOP.startTimer({operation: "find_logged_in_user", type: "findById"});
        const user = await User.findById(userId)
        op()

        if (!user){
            throw new ApiError(400, "Unauth Request")
        }

        const op1 = mongoOP.startTimer({operation: "checkPassword", type: "Bcrypt_Compare"})
        const isPassCorrect = await user.isPasswordCorrect(oldPassword)
        op1()
        if (!isPassCorrect){
            throw new ApiError(400, "Invalid Password")
        }

        const op2 = mongoOP.startTimer({operation: "save_password", type:"save"})
        user.password = newPassword
        await user.save({validateBeforeSave: false})
        op2()
        await redis.del(`user:${user._id}:profile`)
        await redis.del(`users:profile`)
        changePasswordCounter.inc()
        return res.status(200)
        .json(new ApiResponse(200,{},"Password Changed"))
            
        } catch (error) {
            throw new ApiError (400, error?.message)
        }
});

const updateAccount = asyncHandler( async (req, res) => {
    try {
        const { username, fullname } = req.body

        const updateFields = {};
        if (username) updateFields.username = username;
        if (fullname) updateFields.fullname = fullname;


        if (Object.keys(updateFields).length === 0) {
            throw new ApiError(400, "No fields provided for update");
        }
        const userId = req.headers["x-user-id"];
        if (!userId) {
            throw new ApiError(401, "Unauthorized");
        }

        const op = mongoOP.startTimer({operation: "update_new_info", type: "findByIdAndUpdate"})
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateFields,
            { new: true, runValidators: true }
        ).select("-password -refreshToken");
        op()

        if (!updatedUser){
            throw new ApiError(400, "Something fishy !!!")
        }
        
        updateAccCounter.inc({
            username: !!username,   
            fullname: !!fullname    
        })

        await redis.del(`user:${updatedUser._id}:profile`)
        await redis.del(`users:profile`)
        await redis.set(`user:${updatedUser._id}:profile`, JSON.stringify(updatedUser), "EX", 3600);
        
        return res.status(200).json(new ApiResponse(200, updatedUser, "Information Updated"))
    } catch (error) {
        throw new ApiError(400, error?.message)
    }
})

export {changePass, updateAccount}
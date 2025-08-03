import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../model/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const changePass = asyncHandler ( async (req, res) => {
    try {
        const {oldPassword, newPassword} = req.body;
        const user = await User.findById(req.body.user?._id)
        const isPassCorrect = await user.isPasswordCorrect(oldPassword)

        if (!isPassCorrect){
            throw new ApiError(400, "Invalid Password")
        }

        user.password = newPassword
        user.save({validateBeforeSave: false})

        return res.status(200)
        .json(new ApiResponse(200,{},"Password Changed"))
            
        } catch (error) {
            throw new ApiError (400, error?.message)
        }
});

export {changePass}
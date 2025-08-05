import redis from "../utils/redisClient.js";
import { PublicKey } from "../model/publicKey.model.js";
import { ApiError } from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import { User } from "../model/user.model.js";
import { fetchPublicKeyCounter, mongoOP } from "../metrics.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const addUpdatePublicKey = asyncHandler(async (req, res) => {
    try {

        if (!req.user){
            throw new ApiError(401, "Middleware Not Working ....")
        }
        const {publicKey} = req.body;
        if (!publicKey){
            throw new ApiError(400, "Public Key Not Found")
        }

        const userId = req.user._id
        const redisKey = `${userId}:publicKey`
        redis.del(redisKey)

        const op = mongoOP.startTimer({operation: "add_update_public_key", type: "findOneAndUpdate"})
        const publicKeyResponse = await PublicKey.findOneAndUpdate(
            { userId },
            { publicKey },
            { upsert: true, new: true }
        );
        op()
        redis.set(redisKey, JSON.stringify(publicKeyResponse), "EX", 3600); 

        return res.status(200).
        json(new ApiResponse(200, publicKeyResponse, "Public Key Updated or Added Successfully"))
        
    } catch (error) {
        throw new ApiError(400, error?.message)
    }
});

const getPublicKey = asyncHandler(async (req, res) => {
    try {

       if (!req.user){
           throw new ApiError(401, "Middleware Not Working or Unauthorized Request ....")
       }
       const {email} = req.body
       const redisemailtoId = `findId:${email}`
       const cachedId = await redis.get(redisemailtoId);

       if (!cachedId){
            const op = mongoOP.startTimer({operation: "find_Id_by_email", type: "findOne"})
            const userId = await User.findOne({email}).select("_id")
            op()
            await redis.set(redisemailtoId, JSON.stringify(userId), "EX", 3600)
       }

       const userId = JSON.parse(cachedId)

       const redisKey = `${userId._id}:publicKey`
       const cached = await redis.get(redisKey);
       if (cached){ 
           fetchPublicKeyCounter.inc({user_id: userId._id, how: "cached"})
           return res.status(200).
           json(new ApiResponse(200, JSON.parse(cached), "Public Key Fetched Successfully from Cache"))
       }

       const op1 = mongoOP.startTimer({operation: "find_public_key_by_id", type: "findOne"})
       const publicKeyResponse = await PublicKey.findOne({userId: userId._id})
       op1()
       redis.set(redisKey, JSON.stringify(publicKeyResponse), "EX", 3600)

       fetchPublicKeyCounter.inc({user_id: userId._id, how: "db"})
       
       return res.status(200).
       json(new ApiResponse(200, publicKeyResponse, "Public Key Fetched Successfully"))


    } catch (error) {
        throw new ApiError(400, error?.message)
    }
})

export { addUpdatePublicKey, getPublicKey }
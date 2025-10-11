import redis from "../utils/redisClient.js";
import { Key } from "../model/key.model.js";
import { ApiError } from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import { User } from "../model/user.model.js";
import { fetchPublicKeyCounter, mongoOP } from "../metrics.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const addKeys = asyncHandler(async (req, res) => {
    try {
        const { publicKey, privateKey } = req.body;
        const user = req.user._id;  // ensure ObjectId

        const op = mongoOP.startTimer({ operation: "add_keys", type: "create" });
        const KeyResponse = await Key.create({
            user,                    // correct field name
            publickey: publicKey,
            privatekey: privateKey,
        })
        op();

        if (!KeyResponse) {
            throw new ApiError(400, "Keys Not Added");
        }

        const redisKey = `${user}:keys`;
        await redis.set(redisKey, JSON.stringify(KeyResponse), "EX", 3600);

        return res.status(200).json(new ApiResponse(200, KeyResponse, "Keys Added Successfully"));
        
    } catch (error) {
        throw new ApiError(400, error?.message)
    }
});

const getPrivateKey = asyncHandler(async (req, res) => {
    try {
        const userId = req.user._id
        const op = mongoOP.startTimer({operation: "find_keys_by_id", type: "findOne"})
        const KeyResponse = await Key.findOne({user:userId});
        op()
        if (!KeyResponse){
            throw new ApiError(400, "Private Key Not Found")
        }
        return res.status(200).
        json(new ApiResponse(200, KeyResponse, "Private Key Fetched Successfully"))
    } catch (error) {
        throw new ApiError(400, error?.message)
    }
})

const checkKeys = asyncHandler(async (req, res) => {
    // try {
        if (!req.user){
            throw new ApiError(401, "Middleware Not Working ....")
        }
        const userId = req.user._id
        const op = mongoOP.startTimer({operation: "find_keys_by_id", type: "findOne"})
        const KeyResponse = await Key.findOne({user: userId}).select("-privateKey");
        op()
        const found = !!KeyResponse;
        if (KeyResponse){
            return res.status(200).
            json(new ApiResponse(200, found, "Key Fetched Successfully"))
        }
        else{
            return res.status(200).
            json(new ApiResponse(200, found, "Key Not Found"))
        }
    // } catch (error) {
    //     throw new ApiError(400, error?.message)
    // }
})

const getPublicKey = asyncHandler(async (req, res) => {
  try {
    if (!req.user) {
      throw new ApiError(401, "Middleware Not Working or Unauthorized Request ....");
    }

    const { userId } = req.body; // direct userId from request body

    if (!userId) {
      throw new ApiError(400, "userId is required in the request body");
    }

    const redisKey = `${userId}:publicKey`;
    const cached = await redis.get(redisKey);

    if (cached) {
      fetchPublicKeyCounter.inc({ user_id: userId, how: "cached" });
      return res.status(200).json(
        new ApiResponse(200, JSON.parse(cached), "Public Key Fetched Successfully from Cache")
      );
    }

    // Fetch from MongoDB if not cached
    const op = mongoOP.startTimer({ operation: "find_public_key_by_id", type: "findOne" });
    const publicKeyResponse = await Key.findOne({ user: userId }).select("-privateKey");
    op();

    if (!publicKeyResponse) {
      throw new ApiError(404, "Public key not found for this userId");
    }

    // Cache in Redis for next time
    await redis.set(redisKey, JSON.stringify(publicKeyResponse), "EX", 3600);

    fetchPublicKeyCounter.inc({ user_id: userId, how: "db" });

    return res.status(200).json(
      new ApiResponse(200, publicKeyResponse, "Public Key Fetched Successfully")
    );

  } catch (error) {
    throw new ApiError(400, error?.message);
  }
});

export { addKeys, checkKeys, getPublicKey, getPrivateKey }
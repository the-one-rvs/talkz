import { User } from "../../model/user.model.js";
import redis from "../../utils/redisClient.js";
import { ApiError } from "../../utils/ApiError.js";

export const userResolvers = {
  Query: {
    currentUser: async (_, __, { user }) => {
      if (!user){
        throw new ApiError(400, "Unauthorized")
      }

      const key = `user:${user._id}:profile`;
      const cached = await redis.get(key);

      if (cached) return JSON.parse(cached);

      const currentUser = await User.findById(user._id).select("-password -refreshToken");
      await redis.set(key, JSON.stringify(currentUser),  'EX', 300 );

      return currentUser;
    },

    
    allUsers: async (_, __, { user }) => {
      if (!user){
        throw new ApiError(400, "Unauthorized")
      }

      const key = `users:profile`;
      const cached = await redis.get(key);

      if (cached) return JSON.parse(cached);
      //should contain current user too..
      const users = await User.find().select("-password -refreshToken");
      await redis.set(key, JSON.stringify(users), 'EX', 120);

      return users;
    },
  },
};

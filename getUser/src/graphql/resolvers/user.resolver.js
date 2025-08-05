import { User } from "../../model/user.model.js";
import redis from "../../utils/redisClient.js";
import { ApiError } from "../../utils/ApiError.js";
import { allUserCounter, currentUserCounter, mongoOP } from "../../metrics.js";

export const userResolvers = {
  Query: {
    currentUser: async (_, __, { user }) => {
      if (!user){
        throw new ApiError(400, "Unauthorized")
      }

      const key = `user:${user._id}:profile`;
      const cached = await redis.get(key);

      if (cached){ 
        currentUserCounter.inc({user_id: user._id, how: "cached"})
        return JSON.parse(cached);
      }

      const op = mongoOP.startTimer({operation: "get_current_user", type: "findById"});
      const currentUser = await User.findById(user._id).select("-password -refreshToken");
      op()
      await redis.set(key, JSON.stringify(currentUser),  'EX', 300 );
      currentUserCounter.inc({user_id: user._id, how: "db"})

      return currentUser;
    },

    
    allUsers: async (_, __, { user }) => {
      if (!user){
        throw new ApiError(400, "Unauthorized")
      }

      const key = `users:profile`;
      const cached = await redis.get(key);

      if (cached){ 
        allUserCounter.inc({how: "cached"})
        return JSON.parse(cached);
      }
      //should contain current user too..
      const op1 = mongoOP.startTimer({operation: "get_all_users", type: "find"});
      const users = await User.find().select("-password -refreshToken");
      op1()

      await redis.set(key, JSON.stringify(users), 'EX', 120);
      allUserCounter.inc({how: "db"})
      return users;
    },
  },
};

import { User } from "../model/user.model.js";


export const getUniqueUsername = async (email) => {
  const base = email.split("@")[0].toLowerCase();
  let username = base;
  let exists = await User.findOne({ username });

  let counter = 1;

  while (exists) {
    
    username = `${base}${Math.floor(10000 + Math.random() * 90000)}`; 
    exists = await User.findOne({ username });

    if (counter++ > 100) break; 
  }

  return username;
};

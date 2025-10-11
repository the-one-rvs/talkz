import { User } from "../model/user.model.js";

export const getUniqueUsername = async (email) => {
  let base = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, ""); // remove dots/special chars
  let username = base;
  let exists = await User.findOne({ username });

  let attempts = 0;

  while (exists && attempts < 10) {
    username = `${base}${Math.floor(1000 + Math.random() * 9000)}`; // 4-digit random number
    exists = await User.findOne({ username });
    attempts++;
  }

  // Fallback (just in case)
  if (exists) {
    username = `${base}${Date.now()}`;
  }

  return username;
};

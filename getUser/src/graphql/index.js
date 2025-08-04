import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { userResolvers } from "./resolvers/user.resolver.js";

// Needed for __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Now resolve absolute path to user.graphql
const typeDefs = readFileSync(path.join(__dirname, "schemas", "user.graphql"), "utf8");

export const schema = makeExecutableSchema({
  typeDefs,
  resolvers: userResolvers,
});

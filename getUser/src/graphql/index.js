import { readFileSync } from "fs";
import path from "path";
// import { fileURLToPath } from "url";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { userResolvers } from "./resolvers/user.resolver.js";
import { loadFilesSync } from "@graphql-tools/load-files";
// Needed for __dirname in ES Modules
import { fileURLToPath } from 'url';
import { dirname } from 'path';
// import {User} from "../model/user.model.js"

const __dirname = dirname(fileURLToPath(import.meta.url));

const typesArray = loadFilesSync(path.join(__dirname, '**/*.graphql'));
// const typesArray = loadFilesSync(path.join(__dirname, '**/*.graphql'));
// const resolversArray = loadFilesSync(path.join(__dirname, '**/*.resolver.js'));

export const schema = makeExecutableSchema({
    typeDefs: typesArray,
    resolvers: userResolvers
});

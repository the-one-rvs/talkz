import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { schema } from "./graphql/index.js";
import { prometheusMiddleware } from "./middleware/prom.middleware.js";
import { register } from "./metrics.js";
import { User } from "./model/user.model.js";
// import { expressMiddleware } from "@apollo/server/express4";


const app = express();

app.use(prometheusMiddleware);

app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));

app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: true, limit: "20kb" }));
app.use(cookieParser());
const server = new ApolloServer({
    schema
});

await server.start();

app.use('/graphql', expressMiddleware(server, {
  context: async ({ req }) => {
    const userId = req.headers["x-user-id"];
    if (!userId) return { user: null };
    const user = await User.findById(userId);
    return { user: user || null };
  }
}));

app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

export { app };

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { ApolloServer } from "apollo-server-express";
import { schema } from "./graphql/index.js";
import { prometheusMiddleware } from "./middleware/prom.middleware.js";
import { fetchUser } from "./middleware/fetchUser.middleware.js";
import { register } from "./metrics.js";
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
  schema,
  context: ({ req, res }) => ({ req, res }),
});

await server.start();

app.use(
  "/graphql",
  fetchUser
);

app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

export { app };

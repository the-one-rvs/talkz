import express from "express";
const app = express()
import { prometheusMiddleware } from "./middleware/prom.middleware.js";
import cors from "cors";
app.use(prometheusMiddleware);
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))
app.use(express.json({limit: "20kb"}))
app.use(express.urlencoded({extended: true, limit: "20kb" }))

import { register } from "./metrics.js";
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

import logoutRouter from './routes/logout.route.js'
app.use("/",logoutRouter)

export { app }

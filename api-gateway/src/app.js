import express from "express";
const app = express()
import { prometheusMiddleware } from "./middleware/prom.middleware.js";
import cors from "cors";
app.use(prometheusMiddleware);
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credential: true
}))
app.use(express.json({limit: "20kb"}))
app.use(express.urlencoded({extended: true, limit: "20kb" }))

import { register } from "./metrics.js";
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

import proxy from "express-http-proxy";
import { verifyJWT } from "./middleware/authZ.middleware.js";
import { interceptResponse } from "./middleware/cookieSetup.middleware.js";

app.use("/registerService", proxy(process.env.REGISTER_USER_WEB));
app.use("/generateTokenService", verifyJWT, proxy(process.env.TOKEN_GENRATE_WEB));

app.use("/loginService", proxy(process.env.LOGIN_USER_WEB, {
  proxyReqPathResolver: req => "/login",
  userResDecorator: async (proxyRes, proxyResData, req, res) => {
    interceptResponse(proxyRes, req, res);
    return proxyResData; 
  }
}));


export { app }

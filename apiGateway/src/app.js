import express from "express";
const app = express()
import { prometheusMiddleware } from "./middleware/prom.middleware.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import { createProxyMiddleware } from "http-proxy-middleware";

app.use(bodyParser.json()); 

app.use(prometheusMiddleware);
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))
app.use(express.json({limit: "20kb"}))
app.use(express.urlencoded({extended: true, limit: "20kb" }))
app.use(cookieParser());

app.use(
  "/socket.io",
  createProxyMiddleware({
    target: "http://chat:5058",
    ws: true,
    changeOrigin: true,
    logLevel: "debug",
  })
);

import { register } from "./metrics.js";
import { setProxies } from "./proxy.js";
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

// import { app } from "./app.js";

setProxies(app)

export { app }

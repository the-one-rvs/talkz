import { app } from "./app.js";
import proxy from "express-http-proxy";
import { verifyJWT } from "./middleware/authZ.middleware.js";
import { interceptResponse } from "./middleware/cookieSetup.middleware.js";

app.use("/registerService", proxy(process.env.REGISTER_USER_WEB));
app.use("/generateTokenService", verifyJWT, proxy(process.env.TOKEN_GENERATE_WEB));

app.use("/loginService", proxy(process.env.LOGIN_USER_WEB, {
  proxyReqPathResolver: req => "/login",
  userResDecorator: async (proxyRes, proxyResData, req, res) => {
    interceptResponse(proxyRes, req, res);
    return proxyResData; 
  }
}));
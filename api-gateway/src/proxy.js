import proxy from "express-http-proxy";
import { verifyJWT } from "./middleware/authZ.middleware.js";
import { interceptResponse } from "./decorator/cookieSetup.decorator.js";

export function setProxies(app)  {
    app.use("/registerService", proxy(process.env.REGISTER_USER_WEB));
    app.use("/generateTokenService",  proxy(process.env.TOKEN_GENERATE_WEB, {
        proxyReqPathResolver: req => "/refreshAccessToken",
    userResDecorator: async (proxyRes, proxyResData, req, res) => {
        interceptResponse(proxyRes, req, res);
        return proxyResData;
    }
    }));

    app.use("/loginService", proxy(process.env.LOGIN_USER_WEB, {
    proxyReqPathResolver: req => "/login",
    userResDecorator: async (proxyRes, proxyResData, req, res) => {
        interceptResponse(proxyRes, req, res);
        return proxyResData; 
    }
    }));

    app.use("/oAuthService", proxy(process.env.OAUTH_WEB, {
    proxyReqPathResolver: req => req.originalUrl.replace("/oAuthService", ""),
    userResDecorator: async (proxyRes, proxyResData, req, res) => {
        interceptResponse(proxyRes, req, res);
        return proxyResData;
    }}));

    app.use("/updateService", verifyJWT, proxy(process.env.UPDATE_WEB, {
    proxyReqBodyDecorator: async (bodyContent, srcReq) => {
    return {
        ...(typeof bodyContent === 'object' && bodyContent !== null ? bodyContent : {}),
        user: srcReq.user
    };
    }
    }));
}
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

    app.use("/logoutService", verifyJWT, proxy(process.env.LOGOUT_USER_WEB, {
    proxyReqPathResolver: () => "/logout",

    proxyReqOptDecorator: (proxyReqOpts) => {
        proxyReqOpts.method = 'POST'; // force POST
        return proxyReqOpts;
    },

    proxyReqBodyDecorator: async (bodyContent, srcReq) => {
        return {
        ...(typeof bodyContent === 'object' && bodyContent !== null ? bodyContent : {}),
        user: srcReq.user
        };
    },

    userResDecorator: async (proxyRes, proxyResData, req, res) => {
    const options = {
        httpOnly: true,
        secure: true,
        sameSite: "None"
    };

    res.clearCookie("accessToken", options);
    res.clearCookie("refreshToken", options);

    const contentType = proxyRes.headers["content-type"] || "";

    if (contentType.includes("application/json")) {
        try {
        return JSON.parse(proxyResData.toString("utf8"));
        } catch (err) {
        console.error("Failed to parse JSON:", err);
        return {
            status: proxyRes.statusCode,
            message: "Invalid JSON response from logout service"
        };
        }
    } else {
        console.error("HTML response received from logout service:", proxyResData.toString("utf8"));
        return {
        status: proxyRes.statusCode,
        message: "Logout service did not return JSON"
        };
    }
    }

    }));

    // app.use("/logoutService", verifyJWT, proxy(process.env.LOGOUT_USER_WEB, {
    // proxyReqBodyDecorator: async (bodyContent, srcReq) => {
    // return {
    //     ...(typeof bodyContent === 'object' && bodyContent !== null ? bodyContent : {}),
    //     user: srcReq.user
    // };
    // }
    // }));

}
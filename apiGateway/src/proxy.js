// src/proxy.js
import proxy from "express-http-proxy";
import { verifyJWT } from "./middleware/authZ.middleware.js";
import { interceptResponse } from "./decorator/cookieSetup.decorator.js";
import { removeCookie } from "./decorator/cookieRemover.decortor.js";

export function setProxies(app) {
  const API_BASE = "/api/v1";

  // --- Register Service ---
  app.use(
    `${API_BASE}/registerService`,
    proxy(process.env.REGISTER_USER_WEB)
  );

  // --- Token Generation ---
  app.use(
    `${API_BASE}/generateTokenService`,
    proxy(process.env.TOKEN_GENERATE_WEB, {
      proxyReqPathResolver: () => "/refreshAccessToken",
      userResDecorator: async (proxyRes, proxyResData, req, res) => {
        interceptResponse(proxyRes, req, res);
        return proxyResData;
      },
    })
  );

  // --- Login Service ---
  app.use(
    `${API_BASE}/loginService`,
    proxy(process.env.LOGIN_USER_WEB, {
      proxyReqPathResolver: () => "/login",
      userResDecorator: async (proxyRes, proxyResData, req, res) => {
        interceptResponse(proxyRes, req, res);
        return proxyResData;
      },
    })
  );

  // --- OAuth Service ---
  app.use(
    `${API_BASE}/oAuthService`,
    proxy(process.env.OAUTH_WEB, {
      proxyReqPathResolver: (req) =>
        req.originalUrl.replace(`${API_BASE}/oAuthService`, ""),
      userResDecorator: async (proxyRes, proxyResData, req, res) => {
        interceptResponse(proxyRes, req, res);
        return proxyResData;
      },
      followRedirects: true,
    })
  );

  // --- Update Service (JWT required) ---
  app.use(
    `${API_BASE}/updateService`,
    verifyJWT,
    proxy(process.env.UPDATE_WEB, {
      proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        const user = srcReq.user;
        proxyReqOpts.headers["x-user-id"] = user._id;
        return proxyReqOpts;
      },
    })
  );

  // --- Logout Service (JWT required) ---
  app.use(
    `${API_BASE}/logoutService`,
    verifyJWT,
    proxy(process.env.LOGOUT_USER_WEB, {
      proxyReqPathResolver: () => "/logout",
      proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        const user = srcReq.user;
        proxyReqOpts.headers["x-user-id"] = user._id;
        return proxyReqOpts;
      },
      userResDecorator: async (proxyRes, proxyResData, req, res) => {
        // res.clearCookie("accessToken", { httpOnly: true, secure: true, sameSite: "lax", path: "/" });
        // res.clearCookie("refreshToken", { httpOnly: true, secure: true, sameSite: "lax", path: "/" });
        console.log("response decorator");
        removeCookie(proxyRes, req, res);
        return proxyResData;
      },
    })
  );

  // --- Get User Service (JWT required) ---
  app.use(
    `${API_BASE}/getUserService`,
    verifyJWT,
    proxy(process.env.GET_USER_WEB, {
      proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        const user = srcReq.user;
        proxyReqOpts.headers["x-user-id"] = user._id;
        return proxyReqOpts;
      },
    })
  );

  // --- Key Handler Service (JWT required) ---
  app.use(
    `${API_BASE}/keyHandlerService`,
    verifyJWT,
    proxy(process.env.KEY_HANDLER_WEB, {
      proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        const user = srcReq.user;
        proxyReqOpts.headers["x-user-id"] = user._id;
        return proxyReqOpts;
      },
    })
  );

  app.use(
    `${API_BASE}/isLoggedIn`,
    (req, res) => {
      const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
      if (token){
        return res.status(200).json({ isLoggedIn: true });
      }
      else{
        return res.status(200).json({ isLoggedIn: false });
      }
    }
  )

  // --- Chat Service (JWT optional for now) ---
  app.use(
    `${API_BASE}/chatService`,
    verifyJWT,
    proxy(process.env.CHAT_WEB)
  );
}


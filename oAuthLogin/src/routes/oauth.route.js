import Router from "express";
import { tokens } from "../controller/oauth.controller.js";
import passport from "passport";

const router = Router()

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get('/google/callback',
    passport.authenticate('google', { session: false }),tokens );

export default router
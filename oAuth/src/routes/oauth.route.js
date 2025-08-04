import Router from "express";
import { addPassword, tokens } from "../controller/oauth.controller.js";
import passport from "passport";

const router = Router()

router.get("/google", (req, res, next) => {
  console.log("Google auth route hit");
  next();
}, passport.authenticate("google", { scope: ["profile", "email"] }));


router.get('/google/callback',
    passport.authenticate('google', { session: false }),tokens );

router.route('/add-password').post(addPassword)

export default router
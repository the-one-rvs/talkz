import Router from "express";
import { addPassword, tokens } from "../controller/oauth.controller.js";
import passport from "passport";

const router = Router()

router.get("/google", (req, res, next) => {
  next();
}, passport.authenticate("google", { scope: ["profile", "email"] }));


router.get('/google/callback',
  passport.authenticate('google', { session: false }),
  tokens
);

router.route('/add-password/:userId').post(addPassword)

export default router
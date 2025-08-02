import { Router } from "express";
import { registerUser } from "../controller/register.controller.js";

const router = Router();

router.route("/register-user").post(registerUser)
router.get("/verify-email", verifyEmail);

export default router;
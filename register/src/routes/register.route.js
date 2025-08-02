import { Router } from "express";
import { registerUser, resendVerificationMail, verifyEmail } from "../controller/register.controller.js";

const router = Router();

router.route("/register-user").post(registerUser)
router.get("/verify-email", verifyEmail);
router.post("/resend-verification-mail", resendVerificationMail)
export default router;
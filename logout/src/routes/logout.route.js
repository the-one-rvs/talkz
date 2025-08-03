import { Router } from "express"
import { logout } from "../controller/logout.controller.js"

const router = Router()

router.route("/logout").post(logout)

export default router
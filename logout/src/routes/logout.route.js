import { Router } from "express"
import { logout } from "../controller/logout.controller.js"

const router = Router()

router.route("/logout").get(logout)

export default router
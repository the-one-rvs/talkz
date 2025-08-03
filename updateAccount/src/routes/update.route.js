import Router from "express"
import { changePass } from "../controller/update.route.js"

const router = Router()

router.route("/change-password").post(changePass)

export default router
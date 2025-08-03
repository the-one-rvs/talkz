import Router from "express"
import { changePass, updateAccount } from "../controller/update.route.js"

const router = Router()

router.route("/change-password").post(changePass)
router.route("/update-info").patch(updateAccount)

export default router
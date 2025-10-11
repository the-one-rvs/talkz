import { Router } from "express"
import { getMessages } from "../controller/getMessages.controller.js"
const router = Router()

router.route("/get-message/:senderId/:receiverId").get(getMessages)

export default router
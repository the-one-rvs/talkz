import { Router } from "express";
import { addUpdatePublicKey, getPublicKey } from "../controller/key.controller.js";
import { fetchUser } from "../middleware/fetchUser.middleware.js";

const router = Router()

router.route("/add-Public-Key").post(fetchUser,addUpdatePublicKey)
router.route("/get-Public-Key").post(fetchUser,getPublicKey)


export default router
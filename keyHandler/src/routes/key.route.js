import { Router } from "express";
import { addKeys, checkKeys, getPrivateKey, getPublicKey } from "../controller/key.controller.js";
import { fetchUser } from "../middleware/fetchUser.middleware.js";

const router = Router()

router.route("/get-Private-key").get(fetchUser, getPrivateKey)
router.route("/add-Keys").post(fetchUser, addKeys)
router.route("/check-Keys").get(fetchUser, checkKeys)
router.route("/get-Public-Key").post(fetchUser,getPublicKey)



export default router
import { Router } from "express";
import { genratetokens } from "../controller/token.controller.js";
import { checkLoginService } from "../middleware/onlyLoginAllow.middleware.js";
const router = Router()

router.route("/token-generate").post(checkLoginService, genratetokens)
export  default router 
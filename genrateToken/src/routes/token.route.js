import { Router } from "express";
import { genratetokens, reclaimTokens } from "../controller/token.controller.js";
import { checkLoginService } from "../middleware/onlyLoginAllow.middleware.js";
const router = Router()

router.route("/token-generate").post(checkLoginService, genratetokens)
router.route("refreshAccessToken").get(reclaimTokens)
export  default router 
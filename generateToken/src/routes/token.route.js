import { Router } from "express";
import { genratetokens, reclaimTokens } from "../controller/token.controller.js";
import { checkPermitedService } from "../middleware/permitAllow.middleware.js";
const router = Router()

router.route("/token-generate").post(checkPermitedService, genratetokens)
router.route("/refreshAccessToken").get(reclaimTokens)
export  default router 
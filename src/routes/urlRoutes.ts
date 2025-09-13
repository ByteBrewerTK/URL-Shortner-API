import { Router } from "express";
import { shortenUrl } from "../controllers/urlController.js";
import { riskCheckMiddleware } from "../middleware/riskCheck.js";

const router = Router();

router.post("/shorten", riskCheckMiddleware, shortenUrl);

export default router;

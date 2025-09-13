import { Router } from "express";
import { redirectUrl, getAnalytics } from "../controllers/urlController.js";

const router = Router();

router.get("/:short_code", redirectUrl);
router.get("/:short_code/analytics", getAnalytics);

export default router;

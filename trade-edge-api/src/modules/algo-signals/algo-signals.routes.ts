import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { latestDaily, latestWeekly, listDaily, listWeekly } from "./algo-signals.controller";

const router = Router();

router.use(authMiddleware);

// Fixed paths before any future :param routes.
router.get("/daily/latest", latestDaily);
router.get("/daily", listDaily);
router.get("/weekly/latest", latestWeekly);
router.get("/weekly", listWeekly);

export default router;

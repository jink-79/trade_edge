import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { listMissedSignals } from "./missed-signals.controller";

const router = Router();

router.use(authMiddleware);

// GET /api/missed-signals?days=
router.get("/", listMissedSignals);

export default router;

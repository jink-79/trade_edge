import { Router } from "express";
import { getCalendar } from "./calendar.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

router.use(authMiddleware);

// GET /api/calendar?year=&month= (month is 0-indexed)
router.get("/", getCalendar);

export default router;

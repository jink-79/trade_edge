import { Router } from "express";
import { getCalendar, getBenchmarks } from "./calendar.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

router.use(authMiddleware);

// GET /api/calendar?year=&month= (month is 0-indexed)
router.get("/", getCalendar);

// GET /api/calendar/benchmarks?year=&month= — daily % return per index,
// for the "how many indices did I beat" comparison
router.get("/benchmarks", getBenchmarks);

export default router;

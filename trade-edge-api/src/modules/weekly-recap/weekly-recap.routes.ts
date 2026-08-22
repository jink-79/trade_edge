import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { getRecap, generateRecap } from "./weekly-recap.controller";

const router = Router();

router.use(authMiddleware);

// GET /api/weekly-recap?weekStart=
router.get("/", getRecap);

// POST /api/weekly-recap/generate?weekStart=
router.post("/generate", generateRecap);

export default router;

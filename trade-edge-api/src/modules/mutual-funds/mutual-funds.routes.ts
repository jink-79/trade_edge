import { Router } from "express";
import { getAll } from "./mutual-funds.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import { MutualFundsQuerySchema } from "./mutual-funds.types";

const router = Router();

// All mutual fund routes require a valid JWT
router.use(authMiddleware);

// GET /api/mutual-funds?category=Largecap&page=1&limit=20
router.get("/", validate(MutualFundsQuerySchema, "query"), getAll);

export default router;

import { Router } from "express";
import { getAll, create } from "./mutual-funds.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import {
  MutualFundsQuerySchema,
  CreateMutualFundSchema,
} from "./mutual-funds.types";

const router = Router();

// All mutual fund routes require a valid JWT
router.use(authMiddleware);

// GET /api/mutual-funds?category=Largecap&page=1&limit=20
router.get("/", validate(MutualFundsQuerySchema, "query"), getAll);

// POST /api/mutual-funds
router.post("/", validate(CreateMutualFundSchema), create);

export default router;

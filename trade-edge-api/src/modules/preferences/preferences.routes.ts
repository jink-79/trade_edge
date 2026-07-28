import { Router } from "express";
import { get, update } from "./preferences.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import { SavePreferencesSchema } from "./preferences.types";

const router = Router();

router.use(authMiddleware);

// GET /api/preferences
router.get("/", get);

// PUT /api/preferences
router.put("/", validate(SavePreferencesSchema), update);

export default router;

import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import * as c from "./possessions.controller";
import { CreatePossessionSchema, PossessionIdParamsSchema, UpdatePossessionSchema } from "./possessions.types";

const router = Router();
router.use(authMiddleware);

// GET    /api/possessions      — everything you own that isn't money
// POST   /api/possessions      — add an item
// PATCH  /api/possessions/:id  — edit an item
// DELETE /api/possessions/:id  — remove an item (sold, given away, broken)
router.get("/", c.list);
router.post("/", validate(CreatePossessionSchema), c.create);
router.patch("/:id", validate(PossessionIdParamsSchema, "params"), validate(UpdatePossessionSchema), c.update);
router.delete("/:id", validate(PossessionIdParamsSchema, "params"), c.remove);

export default router;

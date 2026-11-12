import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import * as c from "./accounts.controller";
import {
  AccountIdParamsSchema,
  CreateAccountSchema,
  SnapshotParamsSchema,
  UpdateAccountSchema,
  UpsertSnapshotSchema,
} from "./accounts.types";

const router = Router();
router.use(authMiddleware);

// GET    /api/accounts                      — all accounts with their latest month
// POST   /api/accounts                      — add an account with its opening value
// GET    /api/accounts/:id                  — one account with its full history
// PATCH  /api/accounts/:id                  — rename / close / reopen
// DELETE /api/accounts/:id                  — delete an account and its history
// PUT    /api/accounts/:id/snapshots/:month — set the value for a month
// DELETE /api/accounts/:id/snapshots/:month — remove one month
router.get("/", c.list);
router.post("/", validate(CreateAccountSchema), c.create);
router.get("/:id", validate(AccountIdParamsSchema, "params"), c.getOne);
router.patch("/:id", validate(AccountIdParamsSchema, "params"), validate(UpdateAccountSchema), c.update);
router.delete("/:id", validate(AccountIdParamsSchema, "params"), c.remove);
router.put(
  "/:id/snapshots/:month",
  validate(SnapshotParamsSchema, "params"),
  validate(UpsertSnapshotSchema),
  c.upsertSnapshot,
);
router.delete("/:id/snapshots/:month", validate(SnapshotParamsSchema, "params"), c.removeSnapshot);

export default router;

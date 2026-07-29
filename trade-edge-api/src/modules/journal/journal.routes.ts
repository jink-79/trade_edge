import { Router } from "express";
import express from "express";
import {
  create,
  getAll,
  getOne,
  exit,
  autoCreate,
  review,
  gttPlaced,
  analyze,
  adherence,
} from "./journal.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import {
  CreateJournalTradeSchema,
  ExitJournalTradeSchema,
  AutoCaptureSchema,
  ReviewJournalTradeSchema,
  GttPlacedSchema,
  AnalyzeTradeSchema,
  SetAdherenceSchema,
} from "./journal.types";

const router = Router();

// Journal payloads carry base64 chart screenshots — allow a larger body here.
// (The global parser skips /api/journal; see app.ts.)
router.use(express.json({ limit: "10mb" }));

router.use(authMiddleware);

// POST /api/journal
router.post("/", validate(CreateJournalTradeSchema), create);

// POST /api/journal/auto  — auto-capture from a Kite trade + candles
router.post("/auto", validate(AutoCaptureSchema), autoCreate);

// GET /api/journal
router.get("/", getAll);

// GET /api/journal/:id
router.get("/:id", getOne);

// POST /api/journal/:id/exit  — record exit and lock the trade
router.post("/:id/exit", validate(ExitJournalTradeSchema), exit);

// POST /api/journal/:id/review  — attach screenshot + comment, clear needs-review
router.post("/:id/review", validate(ReviewJournalTradeSchema), review);

// POST /api/journal/:id/gtt  — mark the target/SL GTT as placed / not
router.post("/:id/gtt", validate(GttPlacedSchema), gttPlaced);

// POST /api/journal/:id/analytics  — MAE/MFE + exit optimizer from candles
router.post("/:id/analytics", validate(AnalyzeTradeSchema), analyze);

// POST /api/journal/:id/adherence  — tag system-following vs discretionary
router.post("/:id/adherence", validate(SetAdherenceSchema), adherence);

export default router;

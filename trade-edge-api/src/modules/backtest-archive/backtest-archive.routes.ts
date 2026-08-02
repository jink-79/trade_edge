import { Router } from "express";
import multer from "multer";
import { authMiddleware } from "../../middleware/auth.middleware";
import {
  upload,
  remove,
  strategies,
  versions,
  report,
  symbolScorecard,
  tradeLog,
  breakdown,
} from "./backtest-archive.controller";

const router = Router();

router.use(authMiddleware);

// In-memory (no disk write) — files are parsed straight into Mongo. XLSX
// workbooks with a full trade log can run several MB.
const uploadFields = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } })
  .fields([
    { name: "xlsx", maxCount: 1 },
    { name: "md", maxCount: 1 },
    { name: "csv", maxCount: 1 },
  ]);

// POST /api/backtest-archive/upload — multipart: xlsx + md (required), csv
// (optional trade log), text fields strategyName/version/universe.
router.post("/upload", uploadFields, upload);

// GET /api/backtest-archive/strategies — distinct strategy names (version picker)
router.get("/strategies", strategies);

// GET /api/backtest-archive/:strategyName/versions — versions+universes for one strategy
router.get("/:strategyName/versions", versions);

// GET /api/backtest-archive/:strategyName/:version/:universe — full report
router.get("/:strategyName/:version/:universe", report);

// DELETE /api/backtest-archive/:strategyName/:version/:universe — remove a version
router.delete("/:strategyName/:version/:universe", remove);

// GET .../symbol-scorecard — paginated/filterable (?page=&pageSize=&q=&verdict=)
router.get("/:strategyName/:version/:universe/symbol-scorecard", symbolScorecard);

// GET .../trade-log — paginated/filterable (?page=&pageSize=&symbol=)
router.get("/:strategyName/:version/:universe/trade-log", tradeLog);

// GET .../breakdown — sector or market-cap breakdown (?group=sector|marketCap)
router.get("/:strategyName/:version/:universe/breakdown", breakdown);

export default router;

import { Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler";
import { sendSuccess, sendCreated } from "../../utils/api-response";
import { AppError } from "../../utils/api-error";
import { parseWorkbookBuffer, parseTradeLogCsv, parseMarkdown } from "./backtest-archive.parser";
import {
  upsertArchive,
  deleteArchive,
  listStrategies,
  listVersions,
  getReport,
  getGroupBreakdown,
  getSymbolScorecardPage,
  getTradeLogPage,
} from "./backtest-archive.service";
import {
  UploadMetaSchema,
  SymbolScorecardQuerySchema,
  TradeLogQuerySchema,
  GroupBreakdownQuerySchema,
} from "./backtest-archive.types";

type UploadedFiles = Record<string, Express.Multer.File[] | undefined>;

// Express 5 types req.params values as `string | string[]` (wildcard routes
// can capture arrays); none of ours do, so these are always plain strings.
function pathParams(req: Request): { strategyName: string; version: string; universe: string } {
  return {
    strategyName: String(req.params.strategyName),
    version: String(req.params.version),
    universe: String(req.params.universe),
  };
}

// POST /api/backtest-archive/upload — multipart: fields xlsx (required), md
// (required), csv (optional, trade log — preferred over the XLSX's own
// Trade Log sheet), plus text fields strategyName/version/universe.
export const upload = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const meta = UploadMetaSchema.parse(req.body);
  const files = (req.files as UploadedFiles) ?? {};

  const xlsxFile = files.xlsx?.[0];
  const mdFile = files.md?.[0];
  const csvFile = files.csv?.[0];
  if (!xlsxFile) throw AppError.badRequest("Missing required file: xlsx");
  if (!mdFile) throw AppError.badRequest("Missing required file: md");

  const parsed = parseWorkbookBuffer(xlsxFile.buffer, meta);
  if (csvFile) {
    parsed.tradeLog = parseTradeLogCsv(csvFile.buffer);
  }
  const md = parseMarkdown(mdFile.buffer);

  // The MD frontmatter is documentation, not the identity — but if it names a
  // different strategy/version than the upload was tagged with, that's very
  // likely a mismatched pair of files, not a value to silently prefer.
  // `universe` is NOT checked here: it's the archive's user-assigned bucket
  // (tracked/fno), not something derived from the file — a run documented
  // against one universe can still be filed under whichever the uploader
  // chooses (e.g. cataloguing everything under "tracked" going forward).
  if (md.strategyName && md.strategyName !== meta.strategyName) {
    throw AppError.badRequest(
      `MD frontmatter strategy_name "${md.strategyName}" does not match the upload's strategyName "${meta.strategyName}"`,
    );
  }
  if (md.version && md.version !== meta.version) {
    throw AppError.badRequest(
      `MD frontmatter version "${md.version}" does not match the upload's version "${meta.version}"`,
    );
  }

  const result = await upsertArchive(userId, meta, parsed, md, {
    xlsx: xlsxFile.originalname,
    csv: csvFile?.originalname ?? null,
    md: mdFile.originalname,
  });

  sendCreated(
    res,
    result.report,
    `Archived ${meta.strategyName}-v${meta.version} (${meta.universe}): ` +
      `${result.symbolCount} symbols, ${result.tradeLogCount} trades`,
  );
});

// DELETE /api/backtest-archive/:strategyName/:version/:universe
export const remove = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { strategyName, version, universe } = pathParams(req);
  const result = await deleteArchive(userId, strategyName, version, universe);
  if (!result.deletedReport) {
    throw AppError.notFound("No archived report for that strategy/version/universe");
  }
  sendSuccess(res, result, `Deleted ${strategyName}-v${version} (${universe})`);
});

// GET /api/backtest-archive/strategies
export const strategies = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const result = await listStrategies(userId);
  sendSuccess(res, result, "Strategies fetched");
});

// GET /api/backtest-archive/:strategyName/versions
export const versions = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const result = await listVersions(userId, String(req.params.strategyName));
  sendSuccess(res, result, "Versions fetched");
});

// GET /api/backtest-archive/:strategyName/:version/:universe
export const report = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { strategyName, version, universe } = pathParams(req);
  const doc = await getReport(userId, strategyName, version, universe);
  if (!doc) throw AppError.notFound("No archived report for that strategy/version/universe");
  sendSuccess(res, doc, "Report fetched");
});

// GET /api/backtest-archive/:strategyName/:version/:universe/symbol-scorecard
export const symbolScorecard = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { strategyName, version, universe } = pathParams(req);
  const query = SymbolScorecardQuerySchema.parse(req.query);
  const result = await getSymbolScorecardPage(userId, strategyName, version, universe, query);
  if (!result) throw AppError.notFound("No symbol scorecard for that strategy/version/universe");
  sendSuccess(res, result, "Symbol scorecard fetched");
});

// GET /api/backtest-archive/:strategyName/:version/:universe/trade-log
export const tradeLog = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { strategyName, version, universe } = pathParams(req);
  const query = TradeLogQuerySchema.parse(req.query);
  const result = await getTradeLogPage(userId, strategyName, version, universe, query);
  sendSuccess(res, result, "Trade log fetched");
});

// GET /api/backtest-archive/:strategyName/:version/:universe/breakdown?group=sector|marketCap
export const breakdown = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { strategyName, version, universe } = pathParams(req);
  const { group } = GroupBreakdownQuerySchema.parse(req.query);
  const result = await getGroupBreakdown(userId, strategyName, version, universe, group);
  if (result === null) throw AppError.notFound("No report for that strategy/version/universe");
  sendSuccess(res, result, "Breakdown fetched");
});

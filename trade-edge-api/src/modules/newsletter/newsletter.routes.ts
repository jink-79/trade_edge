import { Router } from "express";
import { requireCronSecret } from "../../middleware/cron-auth.middleware";
import { run } from "./newsletter.controller";

const router = Router();

router.get("/run", requireCronSecret, run);

export default router;

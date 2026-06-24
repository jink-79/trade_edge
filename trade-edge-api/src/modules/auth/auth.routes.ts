import { Router } from "express";
import { register, login, me } from "./auth.controller";
import { validate } from "../../middleware/validate.middleware";
import { authMiddleware } from "../../middleware/auth.middleware";
import { authRateLimiter } from "../../middleware/rate-limit.middleware";
import { RegisterSchema, LoginSchema } from "./auth.types";

const router = Router();

// POST /api/auth/register
router.post("/register", authRateLimiter, validate(RegisterSchema), register);

// POST /api/auth/login
router.post("/login", authRateLimiter, validate(LoginSchema), login);

// GET /api/auth/me  — protected
router.get("/me", authMiddleware, me);

export default router;

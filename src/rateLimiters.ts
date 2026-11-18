import { rateLimit } from "express-rate-limit";

// Общий лимит на весь API
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later" },
});

// Строгий лимит для /login и /register (защита от перебора паролей и спама)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many attempts, please try again in 15 minutes" },
});

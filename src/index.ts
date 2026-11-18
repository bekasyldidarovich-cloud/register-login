import { env } from "./env.js"; // первым: проверяет .env до всего остального
import express from "express";
import type { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import path from "node:path";
import { prisma } from "./db.js";
import { authMiddleware } from "./authMiddleware.js";
import { validate } from "./validate.js";
import {
  registerSchema,
  loginSchema,
  type RegisterInput,
  type LoginInput,
} from "./schemas.js";
import { globalLimiter, authLimiter } from "./rateLimiters.js";

const app = express();

// Если за прокси (Render, Railway и т.п.), раскомментируй, иначе все IP будут одинаковыми:
// app.set("trust proxy", 1);

// Безопасные HTTP-заголовки. Твои HTML-страницы используют inline <script> и <style>,
// поэтому разрешаем 'unsafe-inline' (лучше потом вынести скрипты в отдельные файлы).
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        upgradeInsecureRequests: null,
      },
    },
  }),
);

// CORS: только разрешённые origins из .env
app.use(cors({ origin: env.CORS_ORIGINS }));

app.use(express.json({ limit: "10kb" }));
app.use(express.static(path.join(process.cwd(), "public")));

// Лимит только на API (статика не считается)
app.use(globalLimiter);

app.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  async (req, res) => {
    const { name, email, password } = req.body as RegisterInput;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
      select: { id: true, name: true, email: true },
    });

    res.status(201).json(user);
  },
);

app.post("/login", authLimiter, validate(loginSchema), async (req, res) => {
  const { email, password } = req.body as LoginInput;

  const user = await prisma.user.findUnique({ where: { email } });
  const isValid = user ? await bcrypt.compare(password, user.password) : false;

  if (!user || !isValid) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  // В токене только id. Никаких паролей и лишних данных.
  const token = jwt.sign({ userId: user.id }, env.JWT_SECRET, {
    expiresIn: "1h",
  });

  res.json({ token });
});

app.get("/profile", authMiddleware, async (_req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: res.locals.userId },
    select: { id: true, name: true, email: true, createdAt: true },
  });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json(user);
});

// Единый обработчик ошибок (должен быть последним, ровно 4 параметра)
app.use(
  (err: { type?: string }, _req: Request, res: Response, _next: NextFunction) => {
    if (err.type === "entity.parse.failed") {
      return res.status(400).json({ error: "Invalid JSON" });
    }
    if (err.type === "entity.too.large") {
      return res.status(413).json({ error: "Request body is too large" });
    }
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  },
);

app.listen(env.PORT, () => {
  console.log(`Server running on http://localhost:${env.PORT}`);
});

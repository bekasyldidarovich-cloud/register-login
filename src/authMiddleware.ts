import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token is missing" });
  }

  const token = header.slice(7);
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    return res.status(500).json({ error: "Server configuration error" });
  }

  try {
    const payload = jwt.verify(token, secret);

    if (typeof payload === "string" || typeof payload.userId !== "number") {
      return res.status(401).json({ error: "Invalid token" });
    }

    res.locals.userId = payload.userId;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

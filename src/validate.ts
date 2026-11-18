import type { Request, Response, NextFunction } from "express";
import type { ZodType } from "zod";

// Middleware: проверяет req.body по схеме.
// Если данные плохие, отвечает 400 и в контроллер не пускает.
export function validate(schema: ZodType) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body ?? {});

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      // error оставляем строкой: фронтенд показывает result.error
      return res
        .status(400)
        .json({ error: details[0]?.message ?? "Invalid data", details });
    }

    req.body = result.data; // уже очищенные данные (trim, lowercase)
    next();
  };
}

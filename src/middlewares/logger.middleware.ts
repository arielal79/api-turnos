import { RequestHandler } from "express";

export const logger: RequestHandler = (req, res, next) => {
  const start = Date.now();

  // "finish" se disara cuando la respuesta ya se envió
  res.on("finish", () => {
    console.log(
      `${req.method} ${req.originalUrl} → ${res.statusCode} (${Date.now() - start}ms)`,
    );
  });

  next();
};

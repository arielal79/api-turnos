import { ErrorRequestHandler, RequestHandler } from "express";
import mongoose from "mongoose";
import { AppError } from "../utils/app-error";

export const notFound: RequestHandler = (req, _res, next) => {
  next(
    new AppError(`Ruta no encontrada: ${req.method} ${req.originalUrl}`, 400),
  );
};

// Unico punto de salida para todos los erros
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  let status = 500;
  let message = "Error interno del servidor";

  if (err instanceof AppError) {
    status = err.statusCode;
    message = err.message;
  } else if (err instanceof mongoose.Error.ValidationError) {
    status = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
  } else if (err instanceof mongoose.Error.CastError) {
    status = 400;
    message = `Valor inválido para "${err.path}"`;
  } else if (err?.code === 11000) {
    status = 409;
    message = "Ya existe un registro con esos datos";
  } else if (err?.type === "entity.parse.failed") {
    status = 400;
    message = "JSON malformado";
  }

  // Los errores inesperados se registran en consola, pero no se muestran al cliente
  if (status === 500) console.error("❌ Error no controlado:", err);

  res.status(status).json({ status: "error", message });
};

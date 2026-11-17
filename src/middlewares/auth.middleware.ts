import { RequestHandler } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { env } from "../config/env";
import { AppError } from "../utils/app-error";
import { Rol } from "../components/user/user.model";

export const authenticate: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return next(new AppError("Token no proporcionado", 401));
  }

  let payload: JwtPayload & { rol: Rol };
  try {
    payload = jwt.verify(header.slice(7), env.jwtSecret) as JwtPayload & {
      rol: Rol;
    };
  } catch (error) {
    const mensaje =
      error instanceof jwt.TokenExpiredError
        ? "Token expirado"
        : "Token inválido";
    return next(new AppError(mensaje, 401));
  }

  if (!payload.sub) {
    return next(new AppError("Token inválido", 401));
  }

  req.user = { id: payload.sub, rol: payload.rol };
  next();
};

export const authorize =
  (...roles: Rol[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) {
      return next(new AppError("No autenticado", 401));
    }
    if (!roles.includes(req.user.rol)) {
      return next(new AppError("No tienes permiso para esta acción", 403));
    }
    next();
  };

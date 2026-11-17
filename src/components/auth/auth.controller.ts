import { RequestHandler } from "express";
import { authService } from "./auth.service";

export const authController: Record<"registrar" | "login", RequestHandler> = {
  async registrar(req, res, next) {
    try {
      const { user, token } = await authService.registrar(req.body ?? {});
      res.status(201).json({ status: "success", data: { user, token } });
    } catch (error) {
      next(error);
    }
  },

  async login(req, res, next) {
    try {
      const { user, token } = await authService.login(req.body ?? {});
      res.status(200).json({ status: "success", data: { user, token } });
    } catch (error) {
      next(error);
    }
  },
};

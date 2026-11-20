import { RequestHandler } from "express";
import { turnoService } from "./turno.service";

// authenticate garantiza que req.user existe, por eso usamos req.user!
export const turnoController: Record<
  "crear" | "listar" | "obtener" | "actualizar" | "eliminar",
  RequestHandler
> = {
  async crear(req, res, next) {
    try {
      const turno = await turnoService.crear(req.user!, req.body ?? {});
      res.status(201).json({ status: "success", data: { turno } });
    } catch (error) {
      next(error);
    }
  },

  async listar(req, res, next) {
    try {
      const turnos = await turnoService.listar(
        req.user!,
        req.query as Record<string, unknown>,
      );
      res
        .status(200)
        .json({ status: "success", results: turnos.length, data: { turnos } });
    } catch (error) {
      next(error);
    }
  },

  async obtener(req, res, next) {
    try {
      const turno = await turnoService.obtener(
        req.user!,
        req.params.id as string,
      );
      res.status(200).json({ status: "success", data: { turno } });
    } catch (error) {
      next(error);
    }
  },

  async actualizar(req, res, next) {
    try {
      const turno = await turnoService.actualizar(
        req.user!,
        req.params.id as string,
        req.body ?? {},
      );
      res.status(200).json({ status: "success", data: { turno } });
    } catch (error) {
      next(error);
    }
  },

  async eliminar(req, res, next) {
    try {
      await turnoService.eliminar(req.params.id as string);
      res.status(200).json({ status: "success", message: "Turno eliminado" });
    } catch (error) {
      next(error);
    }
  },
};

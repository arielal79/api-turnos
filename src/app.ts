import express from "express";
import { logger } from "./middlewares/logger.middleware";
import { errorHandler, notFound } from "./middlewares/error.middleware";

export const app = express();

app.use(logger); // 1°: registra todas las peticiones
app.use(express.json()); // 2°: convierte el body JSON en req.body

app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

//Acá irán las rutas de auth y turnos

app.use(notFound); //si nada ccoincidio → 404
app.use(errorHandler); // siempre al finals

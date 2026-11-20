import express from "express";
import authRoutes from "./components/auth/auth.routes";
import { logger } from "./middlewares/logger.middleware";
import { errorHandler, notFound } from "./middlewares/error.middleware";
import { authenticate, authorize } from "./middlewares/auth.middleware";
import turnoRoutes from "./components/turno/turno.routes";

export const app = express();

app.use(logger); // 1°: registra todas las peticiones
app.use(express.json()); // 2°: convierte el body JSON en req.body

app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/turnos", turnoRoutes); // ← nueva

app.use(notFound); //si nada ccoincidio → 404
app.use(errorHandler); // siempre al final

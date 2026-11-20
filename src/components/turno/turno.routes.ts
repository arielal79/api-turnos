import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth.middleware";
import { turnoController } from "./turno.controller";

const router = Router();

router.use(authenticate); // todas las rutas de turnos requieren JWT

router.get("/", turnoController.listar);
router.get("/:id", turnoController.obtener);
router.post("/", authorize("paciente"), turnoController.crear);
router.put("/:id", turnoController.actualizar);
router.delete("/:id", authorize("admin"), turnoController.eliminar);

export default router;

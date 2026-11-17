import { Router } from "express";
import { authController } from "./auth.controller";

const router = Router();

router.post("/registro", authController.registrar);
router.post("/login", authController.login);

export default router;

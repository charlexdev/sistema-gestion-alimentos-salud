// server/src/routes/plan.routes.ts
import { Router } from "express";
import {
  createPlan,
  getAllPlans,
  getPlanById,
  updatePlan,
  deletePlan,
} from "../controllers/plan.controller";
import {
  authenticateToken,
  authorizeRole,
} from "../middleware/auth.middleware"; // Importar middlewares

const router = Router();

// Rutas para la gestión de planes

// Crear plan (Solo administradores) - RF-10.4
router.post("/", authenticateToken, authorizeRole(["admin"]), createPlan);

// Obtener todos los planes (Usuarios autenticados)
router.get("/", authenticateToken, getAllPlans);

// Obtener un plan por ID (Usuarios autenticados)
router.get("/:id", authenticateToken, getPlanById);

// Actualizar plan (Solo administradores) - RF-10.5
router.put("/:id", authenticateToken, authorizeRole(["admin"]), updatePlan);

// Eliminar plan (Solo administradores) - RF-10.5
router.delete("/:id", authenticateToken, authorizeRole(["admin"]), deletePlan);

export default router;

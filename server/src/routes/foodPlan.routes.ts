// server/src/routes/foodPlan.routes.ts
import { Router } from "express";
import {
  createFoodPlan,
  getAllFoodPlans,
  getFoodPlanById,
  updateFoodPlan,
  deleteFoodPlan,
  getFoodPlanRealVsPlanned, // Nuevo para calcular el real vs planificado
  exportFoodPlansToExcel, // Para reportes
  exportFoodPlansToWord, // Para reportes
} from "../controllers/foodPlan.controller";
import {
  authenticateToken,
  authorizeRole,
} from "../middleware/auth.middleware";

const router = Router();

// Rutas para la gestión de Planes de Alimentos

// Crear Plan de Alimentos (Solo administradores)
router.post("/", authenticateToken, authorizeRole(["admin"]), createFoodPlan);

// Obtener todos los Planes de Alimentos (Usuarios autenticados)
router.get("/", authenticateToken, getAllFoodPlans);

// Obtener un Plan de Alimentos por ID (Usuarios autenticados)
router.get("/:id", authenticateToken, getFoodPlanById);

// Actualizar Plan de Alimentos (Solo administradores)
router.put("/:id", authenticateToken, authorizeRole(["admin"]), updateFoodPlan);

// Eliminar Plan de Alimentos (Solo administradores)
router.delete(
  "/:id",
  authenticateToken,
  authorizeRole(["admin"]),
  deleteFoodPlan
);

// Obtener Real vs Planificado para un Plan de Alimentos (Usuarios autenticados)
router.get("/:id/real-vs-planned", authenticateToken, getFoodPlanRealVsPlanned);

// Rutas de exportación de reportes para Planes de Alimentos
router.get("/export/excel", authenticateToken, exportFoodPlansToExcel);
router.get("/export/word", authenticateToken, exportFoodPlansToWord);

export default router;

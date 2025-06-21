// server/src/routes/foodEntry.routes.ts
import { Router } from "express";
import {
  createFoodEntry,
  getAllFoodEntries,
  getFoodEntryById,
  updateFoodEntry,
  deleteFoodEntry,
} from "../controllers/foodEntry.controller";
import {
  authenticateToken,
  authorizeRole,
} from "../middleware/auth.middleware";

const router = Router();

// Rutas para la gestión de registros de entrada de alimentos (RF-10.1, 10.2, 10.3)

// Crear registro de entrada (Solo administradores)
router.post("/", authenticateToken, authorizeRole(["admin"]), createFoodEntry);

// Obtener todos los registros de entrada (Usuarios autenticados)
router.get("/", authenticateToken, getAllFoodEntries);

// Obtener un registro de entrada por ID (Usuarios autenticados)
router.get("/:id", authenticateToken, getFoodEntryById);

// Actualizar registro de entrada (Solo administradores)
router.put(
  "/:id",
  authenticateToken,
  authorizeRole(["admin"]),
  updateFoodEntry
);

// Eliminar registro de entrada (Solo administradores)
router.delete(
  "/:id",
  authenticateToken,
  authorizeRole(["admin"]),
  deleteFoodEntry
);

export default router;

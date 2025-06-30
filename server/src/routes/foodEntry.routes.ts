// server/src/routes/foodEntry.routes.ts
import { Router } from "express";
import {
  createFoodEntry,
  getAllFoodEntries,
  getFoodEntryById,
  updateFoodEntry,
  deleteFoodEntry,
  exportFoodEntriesToExcel, // Para reportes
  exportFoodEntriesToWord, // Para reportes
} from "../controllers/foodEntry.controller";
import {
  authenticateToken,
  authorizeRole,
} from "../middleware/auth.middleware";

const router = Router();

// Rutas para la gestión de Entradas de Alimentos

// Crear Entrada de Alimentos (Solo administradores)
router.post("/", authenticateToken, authorizeRole(["admin"]), createFoodEntry);

// Obtener todas las Entradas de Alimentos (Usuarios autenticados)
router.get("/", authenticateToken, getAllFoodEntries);

// Obtener una Entrada de Alimentos por ID (Usuarios autenticados)
router.get("/:id", authenticateToken, getFoodEntryById);

// Actualizar Entrada de Alimentos (Solo administradores)
router.put(
  "/:id",
  authenticateToken,
  authorizeRole(["admin"]),
  updateFoodEntry
);

// Eliminar Entrada de Alimentos (Solo administradores)
router.delete(
  "/:id",
  authenticateToken,
  authorizeRole(["admin"]),
  deleteFoodEntry
);

// Rutas de exportación de reportes para Entradas de Alimentos
router.get("/export/excel", authenticateToken, exportFoodEntriesToExcel);
router.get("/export/word", authenticateToken, exportFoodEntriesToWord);

export default router;

// server/src/routes/unitOfMeasurement.routes.ts
import { Router } from "express";
import {
  createUnit,
  getAllUnits,
  getUnitById,
  updateUnit,
  deleteUnit,
  exportUnitsToExcel, // Importar la nueva función
  exportUnitsToWord, // Importar la nueva función
} from "../controllers/unitOfMeasurement.controller";
import {
  authenticateToken,
  authorizeRole,
} from "../middleware/auth.middleware"; // Importar middlewares

const router = Router();

// Rutas para la gestión de unidades de medida

// Crear unidad (Solo administradores)
router.post("/", authenticateToken, authorizeRole(["admin"]), createUnit);

// Obtener todas las unidades (Usuarios autenticados)
router.get("/", authenticateToken, getAllUnits);

// Obtener una unidad por ID (Usuarios autenticados)
router.get("/:id", authenticateToken, getUnitById);

// Actualizar unidad (Solo administradores)
router.put("/:id", authenticateToken, authorizeRole(["admin"]), updateUnit);

// Eliminar unidad (Solo administradores)
router.delete("/:id", authenticateToken, authorizeRole(["admin"]), deleteUnit);

// NUEVAS RUTAS: Exportar unidades de medida
router.get("/export/excel", authenticateToken, exportUnitsToExcel); // Protegida por autenticación
router.get("/export/word", authenticateToken, exportUnitsToWord); // Protegida por autenticación

export default router;

// server/src/routes/medicalCenter.routes.ts
import { Router } from "express";
import {
  createMedicalCenter,
  getAllMedicalCenters,
  getMedicalCenterById,
  updateMedicalCenter,
  deleteMedicalCenter,
  getMedicalCenterInventory,
  exportMedicalCentersToExcel, // <--- NUEVO: Importar la función de exportar a Excel
  exportMedicalCentersToWord, // <--- NUEVO: Importar la función de exportar a Word
} from "../controllers/medicalCenter.controller";
import {
  authenticateToken,
  authorizeRole,
} from "../middleware/auth.middleware";

const router = Router();

// Rutas para la gestión de centros médicos
router.post(
  "/",
  authenticateToken,
  authorizeRole(["admin"]),
  createMedicalCenter
);
router.get("/", authenticateToken, getAllMedicalCenters);
router.get("/:id", authenticateToken, getMedicalCenterById);
router.put(
  "/:id",
  authenticateToken,
  authorizeRole(["admin"]),
  updateMedicalCenter
);
router.delete(
  "/:id",
  authenticateToken,
  authorizeRole(["admin"]),
  deleteMedicalCenter
);

// NUEVA RUTA: Obtener existencias de alimentos por centro médico (RF-7 - Usuarios autenticados)
router.get("/:id/inventory", authenticateToken, getMedicalCenterInventory);

// NUEVAS RUTAS DE EXPORTACIÓN
router.get("/export/excel", authenticateToken, exportMedicalCentersToExcel); // <--- NUEVA RUTA
router.get("/export/word", authenticateToken, exportMedicalCentersToWord); // <--- NUEVA RUTA

export default router;

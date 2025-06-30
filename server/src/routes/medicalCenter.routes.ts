// server/src/routes/medicalCenter.routes.ts
import { Router } from "express";
import {
  createMedicalCenter,
  getAllMedicalCenters,
  getMedicalCenterById,
  updateMedicalCenter,
  deleteMedicalCenter,
  getMedicalCenterStock, // Nueva ruta para ver el stock
  exportMedicalCentersToExcel, // Para reportes
  exportMedicalCentersToWord, // Para reportes
} from "../controllers/medicalCenter.controller";
import {
  authenticateToken,
  authorizeRole,
} from "../middleware/auth.middleware";

const router = Router();

// Rutas para la gestión de Centros Médicos

// Crear Centro Médico (Solo administradores)
router.post(
  "/",
  authenticateToken,
  authorizeRole(["admin"]),
  createMedicalCenter
);

// Obtener todos los Centros Médicos (Usuarios autenticados)
router.get("/", authenticateToken, getAllMedicalCenters);

// Obtener un Centro Médico por ID (Usuarios autenticados)
router.get("/:id", authenticateToken, getMedicalCenterById);

// Actualizar Centro Médico (Solo administradores)
router.put(
  "/:id",
  authenticateToken,
  authorizeRole(["admin"]),
  updateMedicalCenter
);

// Eliminar Centro Médico (Solo administradores)
router.delete(
  "/:id",
  authenticateToken,
  authorizeRole(["admin"]),
  deleteMedicalCenter
);

// Obtener stock de un centro médico por ID (Usuarios autenticados)
router.get("/:id/stock", authenticateToken, getMedicalCenterStock); // GET /api/medical-centers/:id/stock

// Rutas de exportación de reportes para Centros Médicos
router.get("/export/excel", authenticateToken, exportMedicalCentersToExcel);
router.get("/export/word", authenticateToken, exportMedicalCentersToWord);

export default router;

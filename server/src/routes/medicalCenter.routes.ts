import { Router } from "express";
import {
  createMedicalCenter,
  getAllMedicalCenters,
  getMedicalCenterById,
  updateMedicalCenter,
  deleteMedicalCenter,
  getMedicalCenterStock,
  exportMedicalCentersToExcel,
  exportMedicalCentersToWord,
} from "../controllers/medicalCenter.controller";
import {
  authenticateToken,
  authorizeRole,
} from "../middleware/auth.middleware";

const router = Router();

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

router.get("/:id/stock", authenticateToken, getMedicalCenterStock);

router.get("/export/excel", authenticateToken, exportMedicalCentersToExcel);
router.get("/export/word", authenticateToken, exportMedicalCentersToWord);

export default router;

import { Router } from "express";
import {
  createUnit,
  getAllUnits,
  getUnitById,
  updateUnit,
  deleteUnit,
  exportUnitsToExcel,
  exportUnitsToWord,
} from "../controllers/unitOfMeasurement.controller";
import {
  authenticateToken,
  authorizeRole,
} from "../middleware/auth.middleware";

const router = Router();

router.post("/", authenticateToken, authorizeRole(["admin"]), createUnit);

router.get("/", authenticateToken, getAllUnits);

router.get("/:id", authenticateToken, getUnitById);

router.put("/:id", authenticateToken, authorizeRole(["admin"]), updateUnit);

router.delete("/:id", authenticateToken, authorizeRole(["admin"]), deleteUnit);

router.get("/export/excel", authenticateToken, exportUnitsToExcel);
router.get("/export/word", authenticateToken, exportUnitsToWord);

export default router;

import { Router } from "express";
import {
  createFoodEntry,
  getAllFoodEntries,
  getFoodEntryById,
  updateFoodEntry,
  deleteFoodEntry,
  exportFoodEntriesToExcel,
  exportFoodEntriesToWord,
} from "../controllers/foodEntry.controller";
import {
  authenticateToken,
  authorizeRole,
} from "../middleware/auth.middleware";

const router = Router();

router.post("/", authenticateToken, authorizeRole(["admin"]), createFoodEntry);

router.get("/", authenticateToken, getAllFoodEntries);

router.get("/:id", authenticateToken, getFoodEntryById);

router.put(
  "/:id",
  authenticateToken,
  authorizeRole(["admin"]),
  updateFoodEntry
);

router.delete(
  "/:id",
  authenticateToken,
  authorizeRole(["admin"]),
  deleteFoodEntry
);

router.get("/export/excel", authenticateToken, exportFoodEntriesToExcel);
router.get("/export/word", authenticateToken, exportFoodEntriesToWord);

export default router;

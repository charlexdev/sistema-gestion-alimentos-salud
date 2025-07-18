import { Router } from "express";
import {
  createFoodPlan,
  getAllFoodPlans,
  getFoodPlanById,
  updateFoodPlan,
  deleteFoodPlan,
  getFoodPlanRealVsPlanned,
  exportFoodPlansToExcel,
  exportFoodPlansToWord,
} from "../controllers/foodPlan.controller";
import {
  authenticateToken,
  authorizeRole,
} from "../middleware/auth.middleware";

const router = Router();

router.post("/", authenticateToken, authorizeRole(["admin"]), createFoodPlan);

router.get("/", authenticateToken, getAllFoodPlans);

router.get("/:id", authenticateToken, getFoodPlanById);

router.put("/:id", authenticateToken, authorizeRole(["admin"]), updateFoodPlan);

router.delete(
  "/:id",
  authenticateToken,
  authorizeRole(["admin"]),
  deleteFoodPlan
);

router.get("/:id/real-vs-planned", authenticateToken, getFoodPlanRealVsPlanned);

router.get("/export/excel", authenticateToken, exportFoodPlansToExcel);
router.get("/export/word", authenticateToken, exportFoodPlansToWord);

export default router;

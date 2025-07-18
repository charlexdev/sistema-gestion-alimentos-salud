import { Router } from "express";
import {
  createFood,
  getAllFoods,
  getFoodById,
  updateFood,
  deleteFood,
  exportFoodsToExcel,
  exportFoodsToWord,
} from "../controllers/food.controller";
import {
  authenticateToken,
  authorizeRole,
} from "../middleware/auth.middleware";

const router = Router();

router.post("/", authenticateToken, authorizeRole(["admin"]), createFood);

router.get("/", authenticateToken, getAllFoods);

router.get("/:id", authenticateToken, getFoodById);

router.put("/:id", authenticateToken, authorizeRole(["admin"]), updateFood);

router.delete("/:id", authenticateToken, authorizeRole(["admin"]), deleteFood);

router.get("/export/excel", authenticateToken, exportFoodsToExcel);
router.get("/export/word", authenticateToken, exportFoodsToWord);

export default router;

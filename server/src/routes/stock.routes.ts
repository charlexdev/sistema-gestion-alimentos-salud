import { Router } from "express";
import {
  getAllStock,
  exportStockToExcel,
  exportStockToWord,
} from "../controllers/stock.controller";
import {
  authenticateToken,
  authorizeRole,
} from "../middleware/auth.middleware";

const router = Router();

router.get("/", authenticateToken, getAllStock);

router.get("/export/excel", authenticateToken, exportStockToExcel);
router.get("/export/word", authenticateToken, exportStockToWord);

export default router;

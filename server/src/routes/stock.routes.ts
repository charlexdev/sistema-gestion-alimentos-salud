// server/src/routes/stock.routes.ts
import { Router } from "express";
import {
  getAllStock, // Obtener todas las existencias (para una vista global)
  exportStockToExcel, // Para reportes
  exportStockToWord, // Para reportes
} from "../controllers/stock.controller";
import {
  authenticateToken,
  authorizeRole,
} from "../middleware/auth.middleware";

const router = Router();

// Rutas para la consulta y reportes de Existencias

// Obtener todas las existencias (Usuarios autenticados, quizás solo admin o roles con permiso)
router.get("/", authenticateToken, getAllStock);

// Rutas de exportación de reportes para Existencias
router.get("/export/excel", authenticateToken, exportStockToExcel);
router.get("/export/word", authenticateToken, exportStockToWord);

export default router;

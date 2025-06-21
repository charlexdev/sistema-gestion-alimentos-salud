// server/src/routes/food.routes.ts
import { Router } from "express";
import {
  createFood,
  getAllFoods,
  getFoodById,
  updateFood,
  deleteFood,
  exportFoodsToExcel, // Importar la nueva función
  exportFoodsToWord, // Importar la nueva función
} from "../controllers/food.controller";
import {
  authenticateToken,
  authorizeRole,
} from "../middleware/auth.middleware"; // Importar middlewares

const router = Router();

// Rutas para la gestión de alimentos

// Crear alimento (Solo administradores)
router.post("/", authenticateToken, authorizeRole(["admin"]), createFood);

// Obtener todos los alimentos (Usuarios autenticados)
router.get("/", authenticateToken, getAllFoods);

// Obtener un alimento por ID (Usuarios autenticados)
router.get("/:id", authenticateToken, getFoodById);

// Actualizar alimento (Solo administradores)
router.put("/:id", authenticateToken, authorizeRole(["admin"]), updateFood);

// Eliminar alimento (Solo administradores)
router.delete("/:id", authenticateToken, authorizeRole(["admin"]), deleteFood);

// NUEVAS RUTAS: Exportar alimentos
router.get("/export/excel", authenticateToken, exportFoodsToExcel); // Protegida por autenticación
router.get("/export/word", authenticateToken, exportFoodsToWord); // Protegida por autenticación

export default router;

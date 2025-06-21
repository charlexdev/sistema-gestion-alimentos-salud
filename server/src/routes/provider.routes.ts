// server/src/routes/provider.routes.ts
import { Router } from "express";
import {
  createProvider,
  getAllProviders,
  getProviderById,
  updateProvider,
  deleteProvider,
  // === AGREGAR ESTAS IMPORTACIONES ===
  exportProvidersToExcel,
  exportProvidersToWord,
  // =================================
} from "../controllers/provider.controller";
import {
  authenticateToken,
  authorizeRole,
} from "../middleware/auth.middleware"; // Importar middlewares

const router = Router();

// Rutas para la gestión de proveedores (RF-8)

// Crear proveedor (Solo administradores)
router.post("/", authenticateToken, authorizeRole(["admin"]), createProvider);

// Obtener todos los proveedores (Usuarios autenticados)
router.get("/", authenticateToken, getAllProviders);

// Obtener un proveedor por ID (Usuarios autenticados)
router.get("/:id", authenticateToken, getProviderById);

// Actualizar proveedor (Solo administradores)
router.put("/:id", authenticateToken, authorizeRole(["admin"]), updateProvider);

// Eliminar proveedor (Solo administradores)
router.delete(
  "/:id",
  authenticateToken,
  authorizeRole(["admin"]),
  deleteProvider
);

// === NUEVAS RUTAS: Exportar proveedores ===
router.get("/export/excel", authenticateToken, exportProvidersToExcel); // Protegida por autenticación
router.get("/export/word", authenticateToken, exportProvidersToWord); // Protegida por autenticación
// =======================================

export default router;

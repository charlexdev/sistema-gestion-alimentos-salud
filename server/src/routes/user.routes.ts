// src/routes/user.routes.ts
import { Router } from "express";
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  exportUsersToExcel,
  exportUsersToWord,
} from "../controllers/user.controller";
import {
  authenticateToken,
  authorizeRole,
} from "../middleware/auth.middleware";

const router = Router();

// Rutas protegidas para la gestión de usuarios (solo administradores)
router.get("/", authenticateToken, authorizeRole(["admin"]), getAllUsers);
router.get("/:id", authenticateToken, authorizeRole(["admin"]), getUserById);
router.post("/", authenticateToken, authorizeRole(["admin"]), createUser);

router.put(
  "/:id",
  (req, res, next) => {
    // --- INICIO LOGS DE DEPURACIÓN EN user.routes.ts (BACKEND) ---
    console.log(
      "BACKEND LOG (8): user.routes.ts - Capturando ID para PUT:",
      req.params.id
    );
    // --- FIN LOGS DE DEPURACIÓN EN user.routes.ts (BACKEND) ---
    next();
  },
  authenticateToken,
  authorizeRole(["admin"]),
  updateUser
);

router.delete(
  "/:id",
  (req, res, next) => {
    // --- INICIO LOGS DE DEPURACIÓN EN user.routes.ts (BACKEND) ---
    console.log(
      "BACKEND LOG (9): user.routes.ts - Capturando ID para DELETE:",
      req.params.id
    );
    // --- FIN LOGS DE DEPURACIÓN EN user.routes.ts (BACKEND) ---
    next();
  },
  authenticateToken,
  authorizeRole(["admin"]),
  deleteUser
);

// Rutas de exportación
router.get(
  "/export/excel",
  authenticateToken,
  authorizeRole(["admin"]),
  exportUsersToExcel
);
router.get(
  "/export/word",
  authenticateToken,
  authorizeRole(["admin"]),
  exportUsersToWord
);

export default router;

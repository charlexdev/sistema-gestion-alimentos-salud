import { Router } from "express";
import {
  registerUser,
  loginUser,
  getAuthenticatedUser,
} from "../controllers/auth.controller";
import {
  authenticateToken,
  authorizeRole,
} from "../middleware/auth.middleware";

const router = Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", authenticateToken, getAuthenticatedUser);

router.get(
  "/admin-test",
  authenticateToken,
  authorizeRole(["admin"]),
  (req, res) => {
    res.json({
      message: `Bienvenido administrador (ID: ${req.user?.id || ""}, Rol: ${
        req.user?.role || ""
      })!`,
    });
  }
);

export default router;

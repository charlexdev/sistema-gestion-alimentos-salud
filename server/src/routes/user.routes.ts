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

router.get("/", authenticateToken, authorizeRole(["admin"]), getAllUsers);
router.get("/:id", authenticateToken, authorizeRole(["admin"]), getUserById);
router.post("/", authenticateToken, authorizeRole(["admin"]), createUser);

router.put(
  "/:id",
  (req, res, next) => {
    console.log(
      "BACKEND LOG (8): user.routes.ts - Capturando ID para PUT:",
      req.params.id
    );
    next();
  },
  authenticateToken,
  authorizeRole(["admin"]),
  updateUser
);

router.delete(
  "/:id",
  (req, res, next) => {
    console.log(
      "BACKEND LOG (9): user.routes.ts - Capturando ID para DELETE:",
      req.params.id
    );
    next();
  },
  authenticateToken,
  authorizeRole(["admin"]),
  deleteUser
);

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

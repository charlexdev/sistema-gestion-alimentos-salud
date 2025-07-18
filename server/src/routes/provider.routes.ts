import { Router } from "express";
import {
  createProvider,
  getAllProviders,
  getProviderById,
  updateProvider,
  deleteProvider,
  exportProvidersToExcel,
  exportProvidersToWord,
} from "../controllers/provider.controller";
import {
  authenticateToken,
  authorizeRole,
} from "../middleware/auth.middleware";

const router = Router();

router.post("/", authenticateToken, authorizeRole(["admin"]), createProvider);

router.get("/", authenticateToken, getAllProviders);

router.get("/:id", authenticateToken, getProviderById);

router.put("/:id", authenticateToken, authorizeRole(["admin"]), updateProvider);

router.delete(
  "/:id",
  authenticateToken,
  authorizeRole(["admin"]),
  deleteProvider
);

router.get("/export/excel", authenticateToken, exportProvidersToExcel);
router.get("/export/word", authenticateToken, exportProvidersToWord);

export default router;

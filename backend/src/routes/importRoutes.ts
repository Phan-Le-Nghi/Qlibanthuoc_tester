import { Router } from "express";
import {
  getAllImports,
  getImportById,
  createImport,
  completeImport
} from "../controllers/importController";
import {
  authenticateToken,
  authorizeRoles
} from "../middlewares/authMiddleware";

const router = Router();

router.get("/", authenticateToken, authorizeRoles("Admin", "NhanVien"), getAllImports);
router.get("/:id", authenticateToken, authorizeRoles("Admin", "NhanVien"), getImportById);
router.post("/", authenticateToken, authorizeRoles("Admin"), createImport);
router.put("/:id/complete", authenticateToken, authorizeRoles("Admin"), completeImport);

export default router;
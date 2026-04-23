import { Router } from "express";
import { getDashboardSummary } from "../controllers/dashboardController";
import {
  authenticateToken,
  authorizeRoles
} from "../middlewares/authMiddleware";

const router = Router();

router.get(
  "/",
  authenticateToken,
  authorizeRoles("Admin", "NhanVien"),
  getDashboardSummary
);

export default router;
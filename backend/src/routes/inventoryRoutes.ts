import { Router } from "express";
import { getInventory } from "../controllers/inventoryController";
import {
  authenticateToken,
  authorizeRoles
} from "../middlewares/authMiddleware";

const router = Router();

router.get("/", authenticateToken, authorizeRoles("Admin", "NhanVien"), getInventory);

export default router;
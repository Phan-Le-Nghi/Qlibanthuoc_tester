import { Router } from "express";
import {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct
} from "../controllers/productController";
import {
  authenticateToken,
  authorizeRoles
} from "../middlewares/authMiddleware";

const router = Router();

router.get("/", authenticateToken, authorizeRoles("Admin", "NhanVien"), getAllProducts);
router.post("/", authenticateToken, authorizeRoles("Admin"), createProduct);
router.put("/:id", authenticateToken, authorizeRoles("Admin"), updateProduct);
router.delete("/:id", authenticateToken, authorizeRoles("Admin"), deleteProduct);

export default router;
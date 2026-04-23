import { Router } from "express";
import {
  getAllInvoices,
  getInvoiceById,
  getAvailableProductLots,
  createInvoice,
  cancelInvoice,
  payInvoice
} from "../controllers/invoiceController";
import {
  authenticateToken,
  authorizeRoles
} from "../middlewares/authMiddleware";

const router = Router();

router.get(
  "/available-products",
  authenticateToken,
  authorizeRoles("Admin", "NhanVien"),
  getAvailableProductLots
);

router.get(
  "/",
  authenticateToken,
  authorizeRoles("Admin", "NhanVien"),
  getAllInvoices
);

router.get(
  "/:id",
  authenticateToken,
  authorizeRoles("Admin", "NhanVien"),
  getInvoiceById
);

router.post(
  "/",
  authenticateToken,
  authorizeRoles("Admin", "NhanVien"),
  createInvoice
);

router.put(
  "/:id/pay",
  authenticateToken,
  authorizeRoles("Admin", "NhanVien"),
  payInvoice
);

router.put(
  "/:id/cancel",
  authenticateToken,
  authorizeRoles("Admin"),
  cancelInvoice
);

export default router;
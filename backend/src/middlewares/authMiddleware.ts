import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthUserPayload {
  MaTaiKhoan: number;
  TenDangNhap: string;
  VaiTro: string;
}

export interface AuthRequest extends Request {
  user?: AuthUserPayload;
}

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Bạn chưa đăng nhập"
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "default_secret"
    ) as AuthUserPayload;

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Token không hợp lệ hoặc đã hết hạn"
    });
  }
};

export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Bạn chưa đăng nhập"
      });
    }

    const userRole = String(req.user.VaiTro || "").toUpperCase();

    const normalizedAllowedRoles = allowedRoles.map((role) =>
      role.toUpperCase()
    );

    if (!normalizedAllowedRoles.includes(userRole)) {
      return res.status(403).json({
        message: "Bạn không có quyền thực hiện chức năng này"
      });
    }

    next();
  };
};
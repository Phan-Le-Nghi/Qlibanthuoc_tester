import { Request, Response } from "express";
import { pool, poolConnect, sql } from "../config/db";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

export const login = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { tenDangNhap, matKhau } = req.body;

    if (!tenDangNhap || !matKhau) {
      return res.status(400).json({
        message: "Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu"
      });
    }

    await poolConnect;

    const result = await pool.request()
      .input("TenDangNhap", sql.VarChar(50), tenDangNhap)
      .query(`
        SELECT * 
        FROM TaiKhoan
        WHERE TenDangNhap = @TenDangNhap
      `);

    if (result.recordset.length === 0) {
      return res.status(401).json({
        message: "Sai tên đăng nhập hoặc mật khẩu"
      });
    }

    const user = result.recordset[0];

    if (user.TrangThai === 0) {
      return res.status(403).json({
        message: "Tài khoản đã bị khóa"
      });
    }

    let isMatch = false;

    if (user.MatKhauHash && user.MatKhauHash.startsWith("$2")) {
  // mật khẩu đã hash
      isMatch = await bcrypt.compare(matKhau, user.MatKhauHash);
    } else {
  // mật khẩu thường
      isMatch = user.MatKhauHash === matKhau;
    }

    if (!isMatch) {
      return res.status(401).json({
        message: "Sai tên đăng nhập hoặc mật khẩu"
      });
    }

    const token = jwt.sign(
      {
        MaTaiKhoan: user.MaTaiKhoan,
        TenDangNhap: user.TenDangNhap,
        VaiTro: user.VaiTro
      },
      process.env.JWT_SECRET || "default_secret",
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      message: "Đăng nhập thành công",
      token,
      user: {
        MaTaiKhoan: user.MaTaiKhoan,
        TenDangNhap: user.TenDangNhap,
        HoTen: user.HoTen,
        VaiTro: user.VaiTro
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      message: "Lỗi server"
    });
  }
};
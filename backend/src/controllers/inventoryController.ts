import { Request, Response } from "express";
import { pool } from "../config/db";

export const getInventory = async (_req: Request, res: Response) => {
  try {
    const result = await pool.request().query(`
      SELECT
        lh.MaLoHang,
        sp.TenSanPham,
        sp.HamLuong,
        lh.SoLo,
        CONVERT(VARCHAR(10), lh.HanSuDung, 23) AS HanSuDung,
        lh.SoLuong
      FROM LoHangNhap lh
      INNER JOIN ChiTietNhap ctn
        ON lh.MaCTNhap = ctn.MaCTNhap
      INNER JOIN HoaDonNhap hdn
        ON ctn.MaHoaDonNhap = hdn.MaHoaDonNhap
      INNER JOIN SanPham sp
        ON ctn.MaSanPham = sp.MaSanPham
      WHERE hdn.TrangThai = 1
        AND lh.SoLuong > 0
      ORDER BY lh.HanSuDung ASC
    `);

    return res.status(200).json(result.recordset);
  } catch (error) {
    console.error("getInventory error:", error);
    return res.status(500).json({
      message: "Lỗi server khi lấy dữ liệu tồn kho"
    });
  }
};
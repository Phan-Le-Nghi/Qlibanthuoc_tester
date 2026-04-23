import { Request, Response } from "express";
import { pool } from "../config/db";

export const getDashboardSummary = async (_req: Request, res: Response) => {
  try {
    const [
      productResult,
      invoiceResult,
      nearExpiryResult,
      revenueResult,
      importCostResult,
      recentActivityResult,
      topProductsResult
    ] = await Promise.all([
      pool.request().query(`
        SELECT COUNT(*) AS TongSanPham
        FROM SanPham
      `),

      pool.request().query(`
        SELECT COUNT(*) AS TongHoaDon
        FROM HoaDonBan
      `),

      pool.request().query(`
        SELECT COUNT(*) AS SoLoCanHan
        FROM LoHangNhap lh
        INNER JOIN ChiTietNhap ctn
          ON lh.MaCTNhap = ctn.MaCTNhap
        INNER JOIN HoaDonNhap hdn
          ON ctn.MaHoaDonNhap = hdn.MaHoaDonNhap
        WHERE hdn.TrangThai = 1   -- 🔥 CHỈ HOÀN TẤT
          AND lh.HanSuDung >= CAST(GETDATE() AS DATE)
          AND lh.HanSuDung <= DATEADD(DAY, 30, CAST(GETDATE() AS DATE))
          AND lh.SoLuong > 0
      `),

      pool.request().query(`
        SELECT ISNULL(SUM(TongTien), 0) AS DoanhThu
        FROM HoaDonBan
        WHERE TrangThai = 2
      `),

      pool.request().query(`
        SELECT ISNULL(SUM(TongTien), 0) AS ChiPhiNhap
        FROM HoaDonNhap
        WHERE TrangThai = 1
      `),

      pool.request().query(`
        SELECT TOP 10 *
        FROM (
          SELECT
            hdb.NgayBan AS ThoiGian,
            N'BAN' AS Loai,
            CONCAT(
              N'Hóa đơn #HD',
              RIGHT('000000' + CAST(hdb.MaHoaDonBan AS VARCHAR(10)), 6),
              CASE 
                WHEN hdb.TrangThai = 2 THEN N' đã thanh toán'
                WHEN hdb.TrangThai = 3 THEN N' đã hủy'
                ELSE N' đã được tạo'
              END
            ) AS NoiDung,
            hdb.TongTien AS GiaTri
          FROM HoaDonBan hdb

          UNION ALL

          SELECT
            hdn.NgayNhap AS ThoiGian,
            N'NHAP' AS Loai,
            CONCAT(
              N'Phiếu nhập #PN',
              RIGHT('000000' + CAST(hdn.MaHoaDonNhap AS VARCHAR(10)), 6),
              CASE 
                WHEN hdn.TrangThai = 1 THEN N' đã hoàn tất'
                ELSE N' đã được tạo'
              END
            ) AS NoiDung,
            hdn.TongTien AS GiaTri
          FROM HoaDonNhap hdn
          WHERE hdn.TrangThai = 1
        ) AS ActivityData
        ORDER BY ThoiGian DESC
      `),

      pool.request().query(`
        SELECT TOP 5
          sp.MaSanPham,
          sp.TenSanPham,
          sp.HamLuong,
          SUM(ctb.SoLuong) AS TongSoLuongBan,
          SUM(ctb.SoLuong * ctb.DonGia) AS TongDoanhThu
        FROM ChiTietBan ctb
        INNER JOIN HoaDonBan hdb
          ON ctb.MaHoaDonBan = hdb.MaHoaDonBan
        INNER JOIN LoHangNhap lh
          ON ctb.MaLoHang = lh.MaLoHang
        INNER JOIN ChiTietNhap ctn
          ON lh.MaCTNhap = ctn.MaCTNhap
        INNER JOIN SanPham sp
          ON ctn.MaSanPham = sp.MaSanPham
        WHERE hdb.TrangThai = 2
        GROUP BY
          sp.MaSanPham,
          sp.TenSanPham,
          sp.HamLuong
        ORDER BY TongDoanhThu DESC, TongSoLuongBan DESC
      `)
    ]);

    const tongSanPham = Number(productResult.recordset[0]?.TongSanPham ?? 0);
    const tongHoaDon = Number(invoiceResult.recordset[0]?.TongHoaDon ?? 0);
    const soLoCanHan = Number(nearExpiryResult.recordset[0]?.SoLoCanHan ?? 0);
    const doanhThu = Number(revenueResult.recordset[0]?.DoanhThu ?? 0);
    const chiPhiNhap = Number(importCostResult.recordset[0]?.ChiPhiNhap ?? 0);
    const loiNhuanTamTinh = doanhThu - chiPhiNhap;

    return res.status(200).json({
      tongSanPham,
      tongHoaDon,
      soLoCanHan,
      doanhThu,
      chiPhiNhap,
      loiNhuanTamTinh,
      hoatDongGanDay: recentActivityResult.recordset,
      topSanPhamBanChay: topProductsResult.recordset
    });
  } catch (error) {
    console.error("getDashboardSummary error:", error);
    return res.status(500).json({
      message: "Lỗi server khi lấy dữ liệu dashboard"
    });
  }
};
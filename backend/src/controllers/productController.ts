import { Request, Response } from "express";
import { pool, sql } from "../config/db";

export const getAllProducts = async (_req: Request, res: Response): Promise<Response> => {
  try {
    const result = await pool.request().query(`
      SELECT 
        sp.MaSanPham,
        sp.TenSanPham,
        sp.HamLuong,
        sp.DonViTinh,
        sp.GiaBan,
        sp.TrangThai,
        sp.MaNhom,
        ISNULL(
          SUM(
            CASE 
              WHEN hdn.TrangThai = 1 THEN lh.SoLuong
              ELSE 0
            END
          ), 
          0
        ) AS TonKho
      FROM SanPham sp
      LEFT JOIN ChiTietNhap ctn 
        ON sp.MaSanPham = ctn.MaSanPham
      LEFT JOIN HoaDonNhap hdn
        ON ctn.MaHoaDonNhap = hdn.MaHoaDonNhap
      LEFT JOIN LoHangNhap lh
        ON ctn.MaCTNhap = lh.MaCTNhap
      GROUP BY 
        sp.MaSanPham,
        sp.TenSanPham,
        sp.HamLuong,
        sp.DonViTinh,
        sp.GiaBan,
        sp.TrangThai,
        sp.MaNhom
      ORDER BY sp.MaSanPham DESC
    `);

    return res.status(200).json(result.recordset);
  } catch (error) {
    console.error("getAllProducts error:", error);
    return res.status(500).json({
      message: "Lỗi server khi lấy danh sách sản phẩm"
    });
  }
};

export const createProduct = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { tenSanPham, hamLuong, donViTinh, giaBan, maNhom, trangThai } = req.body;

    if (!tenSanPham || !donViTinh || !giaBan || !maNhom) {
      return res.status(400).json({
        message: "Vui lòng nhập đầy đủ thông tin sản phẩm"
      });
    }

    await pool.request()
      .input("TenSanPham", sql.NVarChar(255), tenSanPham)
      .input("HamLuong", sql.NVarChar(100), hamLuong || "")
      .input("DonViTinh", sql.NVarChar(50), donViTinh)
      .input("GiaBan", sql.Decimal(18, 2), Number(giaBan))
      .input("TrangThai", sql.Bit, Number(trangThai ?? 1))
      .input("MaNhom", sql.Int, Number(maNhom))
      .query(`
        INSERT INTO SanPham (TenSanPham, HamLuong, DonViTinh, GiaBan, TrangThai, MaNhom)
        VALUES (@TenSanPham, @HamLuong, @DonViTinh, @GiaBan, @TrangThai, @MaNhom)
      `);

    return res.status(201).json({
      message: "Thêm sản phẩm thành công"
    });
  } catch (error) {
    console.error("createProduct error:", error);
    return res.status(500).json({
      message: "Lỗi server khi thêm sản phẩm"
    });
  }
};

export const updateProduct = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const { tenSanPham, hamLuong, donViTinh, giaBan, maNhom, trangThai } = req.body;

    const checkResult = await pool.request()
      .input("MaSanPham", sql.Int, Number(id))
      .query(`
        SELECT MaSanPham
        FROM SanPham
        WHERE MaSanPham = @MaSanPham
      `);

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy sản phẩm"
      });
    }

    await pool.request()
      .input("MaSanPham", sql.Int, Number(id))
      .input("TenSanPham", sql.NVarChar(255), tenSanPham)
      .input("HamLuong", sql.NVarChar(100), hamLuong || "")
      .input("DonViTinh", sql.NVarChar(50), donViTinh)
      .input("GiaBan", sql.Decimal(18, 2), Number(giaBan))
      .input("TrangThai", sql.Bit, Number(trangThai ?? 1))
      .input("MaNhom", sql.Int, Number(maNhom))
      .query(`
        UPDATE SanPham
        SET
          TenSanPham = @TenSanPham,
          HamLuong = @HamLuong,
          DonViTinh = @DonViTinh,
          GiaBan = @GiaBan,
          TrangThai = @TrangThai,
          MaNhom = @MaNhom
        WHERE MaSanPham = @MaSanPham
      `);

    return res.status(200).json({
      message: "Cập nhật sản phẩm thành công"
    });
  } catch (error) {
    console.error("updateProduct error:", error);
    return res.status(500).json({
      message: "Lỗi server khi cập nhật sản phẩm"
    });
  }
};

export const deleteProduct = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;

    const checkResult = await pool.request()
      .input("MaSanPham", sql.Int, Number(id))
      .query(`
        SELECT MaSanPham
        FROM SanPham
        WHERE MaSanPham = @MaSanPham
      `);

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy sản phẩm"
      });
    }

    await pool.request()
      .input("MaSanPham", sql.Int, Number(id))
      .query(`
        DELETE FROM SanPham
        WHERE MaSanPham = @MaSanPham
      `);

    return res.status(200).json({
      message: "Xóa sản phẩm thành công"
    });
  } catch (error) {
    console.error("deleteProduct error:", error);
    return res.status(500).json({
      message: "Lỗi server khi xóa sản phẩm"
    });
  }
};
import { Request, Response } from "express";
import { pool, sql } from "../config/db";

export const getAllImports = async (_req: Request, res: Response) => {
  try {
    const result = await pool.request().query(`
      SELECT 
        hdn.MaHoaDonNhap,
        hdn.NgayNhap,
        hdn.TongTien,
        hdn.TrangThai,
        tk.HoTen AS NguoiTao,
        COUNT(ctn.MaCTNhap) AS SoMatHang
      FROM HoaDonNhap hdn
      INNER JOIN TaiKhoan tk 
        ON hdn.MaTaiKhoan = tk.MaTaiKhoan
      LEFT JOIN ChiTietNhap ctn 
        ON hdn.MaHoaDonNhap = ctn.MaHoaDonNhap
      GROUP BY
        hdn.MaHoaDonNhap,
        hdn.NgayNhap,
        hdn.TongTien,
        hdn.TrangThai,
        tk.HoTen
      ORDER BY hdn.MaHoaDonNhap DESC
    `);

    return res.status(200).json(result.recordset);
  } catch (error) {
    console.error("getAllImports error:", error);
    return res.status(500).json({
      message: "Lỗi server khi lấy danh sách phiếu nhập"
    });
  }
};

export const getImportById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const importResult = await pool
      .request()
      .input("id", sql.Int, Number(id))
      .query(`
        SELECT 
          hdn.MaHoaDonNhap,
          hdn.NgayNhap,
          hdn.TongTien,
          hdn.TrangThai,
          tk.HoTen AS NguoiTao
        FROM HoaDonNhap hdn
        INNER JOIN TaiKhoan tk
          ON hdn.MaTaiKhoan = tk.MaTaiKhoan
        WHERE hdn.MaHoaDonNhap = @id
      `);

    if (importResult.recordset.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy phiếu nhập"
      });
    }

    const detailResult = await pool
      .request()
      .input("id", sql.Int, Number(id))
      .query(`
        SELECT
          ctn.MaCTNhap,
          sp.TenSanPham,
          sp.HamLuong,
          sp.DonViTinh,
          ctn.SoLuong,
          ctn.GiaNhap,
          ISNULL(lh.SoLo, ctn.SoLo) AS SoLo,
          ISNULL(CONVERT(VARCHAR(10), lh.HanSuDung, 23), CONVERT(VARCHAR(10), ctn.HanSuDung, 23)) AS HanSuDung,
          ISNULL(lh.SoLuong, 0) AS SoLuongLo
        FROM ChiTietNhap ctn
        INNER JOIN SanPham sp
          ON ctn.MaSanPham = sp.MaSanPham
        LEFT JOIN LoHangNhap lh
          ON ctn.MaCTNhap = lh.MaCTNhap
        WHERE ctn.MaHoaDonNhap = @id
        ORDER BY ctn.MaCTNhap ASC
      `);

    return res.status(200).json({
      thongTinChung: importResult.recordset[0],
      chiTiet: detailResult.recordset
    });
  } catch (error) {
    console.error("getImportById error:", error);
    return res.status(500).json({
      message: "Lỗi server khi lấy chi tiết phiếu nhập"
    });
  }
};

export const createImport = async (req: Request, res: Response) => {
  const transaction = new sql.Transaction(pool);

  try {
    const { ngayNhap, trangThai, maTaiKhoan, tongTien, chiTiet } = req.body;

    if (
      !ngayNhap ||
      trangThai === undefined ||
      !maTaiKhoan ||
      !Array.isArray(chiTiet) ||
      chiTiet.length === 0
    ) {
      return res.status(400).json({
        message: "Dữ liệu phiếu nhập không hợp lệ"
      });
    }

    if (![0, 1].includes(Number(trangThai))) {
      return res.status(400).json({
        message: "Trạng thái phiếu nhập không hợp lệ"
      });
    }

    for (const item of chiTiet) {
      if (
        !item.maSanPham ||
        !item.soLo ||
        !item.hanSuDung ||
        !item.soLuong ||
        Number(item.soLuong) <= 0 ||
        !item.giaNhap ||
        Number(item.giaNhap) <= 0
      ) {
        return res.status(400).json({
          message: "Chi tiết phiếu nhập không hợp lệ"
        });
      }

      const hanSuDung = new Date(item.hanSuDung);
      const homNay = new Date();
      homNay.setHours(0, 0, 0, 0);

      if (hanSuDung < homNay) {
        return res.status(400).json({
          message: "Không thể nhập lô đã hết hạn"
        });
      }
    }

    await transaction.begin();

    // 1. Tạo MaHoaDonNhap một lần
    const hdnResult = await new sql.Request(transaction).query(`
      SELECT ISNULL(MAX(MaHoaDonNhap), 0) + 1 AS NewId
      FROM HoaDonNhap
    `);

    const maHoaDonNhap = hdnResult.recordset[0].NewId;

    // 2. Insert HoaDonNhap một lần
    await new sql.Request(transaction)
      .input("MaHoaDonNhap", sql.Int, maHoaDonNhap)
      .input("NgayNhap", sql.DateTime, new Date(ngayNhap))
      .input("TongTien", sql.Decimal(18, 2), Number(tongTien))
      .input("TrangThai", sql.TinyInt, Number(trangThai))
      .input("MaTaiKhoan", sql.Int, Number(maTaiKhoan))
      .query(`
        INSERT INTO HoaDonNhap (MaHoaDonNhap, NgayNhap, TongTien, TrangThai, MaTaiKhoan)
        VALUES (@MaHoaDonNhap, @NgayNhap, @TongTien, @TrangThai, @MaTaiKhoan)
      `);

    // 3. Loop từng item để insert chi tiết + lô hàng
    for (const item of chiTiet) {
      const ctResult = await new sql.Request(transaction).query(`
        SELECT ISNULL(MAX(MaCTNhap), 0) + 1 AS NewCT
        FROM ChiTietNhap
      `);

      const maCTNhap = ctResult.recordset[0].NewCT;

      await new sql.Request(transaction)
        .input("MaCTNhap", sql.Int, maCTNhap)
        .input("MaSanPham", sql.Int, Number(item.maSanPham))
        .input("MaHoaDonNhap", sql.Int, maHoaDonNhap)
        .input("SoLuong", sql.Int, Number(item.soLuong))
        .input("GiaNhap", sql.Decimal(18, 2), Number(item.giaNhap))
        .query(`
          INSERT INTO ChiTietNhap (MaCTNhap, MaSanPham, MaHoaDonNhap, SoLuong, GiaNhap)
          VALUES (@MaCTNhap, @MaSanPham, @MaHoaDonNhap, @SoLuong, @GiaNhap)
        `);

      // Nếu tạo phiếu nhập hoàn tất thì thêm luôn lô hàng
      if (Number(trangThai) === 1) {
        const loResult = await new sql.Request(transaction).query(`
          SELECT ISNULL(MAX(MaLoHang), 0) + 1 AS NewLo
          FROM LoHangNhap
        `);

        const maLoHang = loResult.recordset[0].NewLo;

        await new sql.Request(transaction)
          .input("MaLoHang", sql.Int, maLoHang)
          .input("SoLo", sql.NVarChar(50), item.soLo)
          .input("SoLuong", sql.Int, Number(item.soLuong))
          .input("HanSuDung", sql.DateTime, new Date(item.hanSuDung))
          .input("TrangThaiDuyet", sql.TinyInt, 1)
          .input("MaSanPham", sql.Int, Number(item.maSanPham))
          .input("MaCTNhap", sql.Int, maCTNhap)
          .query(`
            INSERT INTO LoHangNhap (MaLoHang, SoLo, SoLuong, HanSuDung, TrangThaiDuyet, MaSanPham, MaCTNhap)
            VALUES (@MaLoHang, @SoLo, @SoLuong, @HanSuDung, @TrangThaiDuyet, @MaSanPham, @MaCTNhap)
          `);
      }
    }

    await transaction.commit();

    return res.status(201).json({
      message:
        Number(trangThai) === 1
          ? "Tạo phiếu nhập hoàn tất thành công"
          : "Lưu nháp phiếu nhập thành công",
      MaHoaDonNhap: maHoaDonNhap
    });
  } catch (error: any) {
    console.error("createImport error:", error);

    try {
      await transaction.rollback();
    } catch (rollbackError) {
      console.error("rollback error:", rollbackError);
    }

    return res.status(500).json({
      message: "Lỗi server khi tạo phiếu nhập"
    });
  }
};

export const completeImport = async (req: Request, res: Response) => {
  const transaction = new sql.Transaction(pool);

  try {
    const { id } = req.params;
    const importId = Number(id);

    if (!importId) {
      return res.status(400).json({
        message: "Mã phiếu nhập không hợp lệ"
      });
    }

    await transaction.begin();

    const checkResult = await new sql.Request(transaction)
      .input("id", sql.Int, importId)
      .query(`
        SELECT MaHoaDonNhap, TrangThai
        FROM HoaDonNhap
        WHERE MaHoaDonNhap = @id
      `);

    if (checkResult.recordset.length === 0) {
      await transaction.rollback();
      return res.status(404).json({
        message: "Không tìm thấy phiếu nhập"
      });
    }

    const importReceipt = checkResult.recordset[0];

    if (Number(importReceipt.TrangThai) === 1) {
      await transaction.rollback();
      return res.status(400).json({
        message: "Phiếu nhập đã hoàn tất"
      });
    }

    const detailResult = await new sql.Request(transaction)
      .input("id", sql.Int, importId)
      .query(`
        SELECT MaCTNhap, SoLo, SoLuong, HanSuDung
        FROM ChiTietNhap
        WHERE MaHoaDonNhap = @id
      `);

    if (detailResult.recordset.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        message: "Không thể hoàn tất phiếu nhập chưa có sản phẩm"
      });
    }

    // Chỉ lúc này mới cập nhật tồn kho
    for (const item of detailResult.recordset) {
      await new sql.Request(transaction)
        .input("SoLo", sql.NVarChar(50), item.SoLo)
        .input("SoLuong", sql.Int, Number(item.SoLuong))
        .input("HanSuDung", sql.Date, item.HanSuDung)
        .input("TrangThaiDuyet", sql.TinyInt, 1)
        .input("MaCTNhap", sql.Int, Number(item.MaCTNhap))
        .query(`
          INSERT INTO LoHangNhap (SoLo, SoLuong, HanSuDung, TrangThaiDuyet, MaCTNhap)
          VALUES (@SoLo, @SoLuong, @HanSuDung, @TrangThaiDuyet, @MaCTNhap)
        `);
    }

    await new sql.Request(transaction)
      .input("id", sql.Int, importId)
      .input("TrangThai", sql.TinyInt, 1)
      .query(`
        UPDATE HoaDonNhap
        SET TrangThai = @TrangThai
        WHERE MaHoaDonNhap = @id
      `);

    await transaction.commit();

    return res.status(200).json({
      message: "Hoàn tất phiếu nhập thành công"
    });
  } catch (error) {
    console.error("completeImport error:", error);

    try {
      await transaction.rollback();
    } catch (rollbackError) {
      console.error("rollback error:", rollbackError);
    }

    return res.status(500).json({
      message: "Lỗi server khi hoàn tất phiếu nhập"
    });
  }
};
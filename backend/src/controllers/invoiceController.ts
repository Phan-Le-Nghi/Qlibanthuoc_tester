import { Request, Response } from "express";
import sql from "mssql";
import { pool } from "../config/db";

export const getAllInvoices = async (_req: Request, res: Response) => {
  try {
    const result = await pool.request().query(`
      SELECT
        hdb.MaHoaDonBan,
        hdb.NgayBan,
        hdb.TongTien,
        hdb.TrangThai,
        tk.HoTen AS NguoiTao,
        COUNT(ctb.MaCTBan) AS SoMatHang,
        ISNULL(MAX(tt.PhuongThuc), N'-') AS PhuongThucThanhToan,
        N'Khách lẻ' AS KhachHang
      FROM HoaDonBan hdb
      INNER JOIN TaiKhoan tk
        ON hdb.MaTaiKhoan = tk.MaTaiKhoan
      LEFT JOIN ChiTietBan ctb
        ON hdb.MaHoaDonBan = ctb.MaHoaDonBan
      LEFT JOIN ThanhToan tt
        ON hdb.MaHoaDonBan = tt.MaHoaDonBan
      GROUP BY
        hdb.MaHoaDonBan,
        hdb.NgayBan,
        hdb.TongTien,
        hdb.TrangThai,
        tk.HoTen
      ORDER BY hdb.MaHoaDonBan DESC
    `);

    return res.status(200).json(result.recordset);
  } catch (error) {
    console.error("getAllInvoices error:", error);
    return res.status(500).json({
      message: "Lỗi server khi lấy danh sách hóa đơn"
    });
  }
};

export const getInvoiceById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const invoiceResult = await pool
      .request()
      .input("id", sql.Int, Number(id))
      .query(`
        SELECT
          hdb.MaHoaDonBan,
          hdb.NgayBan,
          hdb.TongTien,
          hdb.TrangThai,
          tk.HoTen AS NguoiTao,
          ISNULL(tt.PhuongThuc, N'-') AS PhuongThucThanhToan,
          N'Khách lẻ' AS KhachHang
        FROM HoaDonBan hdb
        INNER JOIN TaiKhoan tk
          ON hdb.MaTaiKhoan = tk.MaTaiKhoan
        LEFT JOIN ThanhToan tt
          ON hdb.MaHoaDonBan = tt.MaHoaDonBan
        WHERE hdb.MaHoaDonBan = @id
      `);

    if (invoiceResult.recordset.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy hóa đơn"
      });
    }

    const detailResult = await pool
      .request()
      .input("id", sql.Int, Number(id))
      .query(`
        SELECT
          ctb.MaCTBan,
          sp.TenSanPham,
          sp.HamLuong,
          lh.SoLo,
          lh.HanSuDung,
          ctb.SoLuong,
          ctb.DonGia,
          (ctb.SoLuong * ctb.DonGia) AS ThanhTien
        FROM ChiTietBan ctb
        INNER JOIN LoHangNhap lh
          ON ctb.MaLoHang = lh.MaLoHang
        INNER JOIN ChiTietNhap ctn
          ON lh.MaCTNhap = ctn.MaCTNhap
        INNER JOIN SanPham sp
          ON ctn.MaSanPham = sp.MaSanPham
        WHERE ctb.MaHoaDonBan = @id
        ORDER BY ctb.MaCTBan ASC
      `);

    return res.status(200).json({
      thongTinChung: invoiceResult.recordset[0],
      chiTiet: detailResult.recordset
    });
  } catch (error) {
    console.error("getInvoiceById error:", error);
    return res.status(500).json({
      message: "Lỗi server khi lấy chi tiết hóa đơn"
    });
  }
};

export const getAvailableProductLots = async (_req: Request, res: Response) => {
  try {
    const result = await pool.request().query(`
      SELECT
        lh.MaLoHang,
        sp.MaSanPham,
        sp.TenSanPham,
        sp.HamLuong,
        sp.DonViTinh,
        lh.SoLo,
        lh.HanSuDung,
        lh.SoLuong AS SoLuongTon,
        sp.GiaBan
      FROM LoHangNhap lh
      INNER JOIN ChiTietNhap ctn
        ON lh.MaCTNhap = ctn.MaCTNhap
      INNER JOIN SanPham sp
        ON ctn.MaSanPham = sp.MaSanPham
      WHERE lh.SoLuong > 0
        AND lh.HanSuDung >= CAST(GETDATE() AS DATE)
      ORDER BY sp.TenSanPham ASC, lh.HanSuDung ASC
    `);

    return res.status(200).json(result.recordset);
  } catch (error) {
    console.error("getAvailableProductLots error:", error);
    return res.status(500).json({
      message: "Lỗi server khi lấy danh sách sản phẩm bán hàng"
    });
  }
};

export const createInvoice = async (req: Request, res: Response) => {
  const transaction = new sql.Transaction(pool);

  try {
    const { ngayBan, maTaiKhoan, phuongThuc, trangThai, tongTien, chiTiet } = req.body;

    if (
      !maTaiKhoan ||
      trangThai === undefined ||
      !Array.isArray(chiTiet) ||
      chiTiet.length === 0
    ) {
      return res.status(400).json({
        message: "Dữ liệu hóa đơn không hợp lệ"
      });
    }

    for (const item of chiTiet) {
      if (
        !item.maLoHang ||
        !item.soLuong ||
        Number(item.soLuong) <= 0 ||
        !item.donGia ||
        Number(item.donGia) <= 0
      ) {
        return res.status(400).json({
          message: "Chi tiết hóa đơn không hợp lệ"
        });
      }
    }

    await transaction.begin();

    for (const item of chiTiet) {
      const stockCheck = await new sql.Request(transaction)
        .input("MaLoHang", sql.Int, Number(item.maLoHang))
        .query(`
          SELECT SoLuong, HanSuDung
          FROM LoHangNhap
          WHERE MaLoHang = @MaLoHang
        `);

      if (stockCheck.recordset.length === 0) {
        await transaction.rollback();
        return res.status(400).json({
          message: "Lô hàng không tồn tại"
        });
      }

      const loHang = stockCheck.recordset[0];

      if (Number(loHang.SoLuong) < Number(item.soLuong)) {
        await transaction.rollback();
        return res.status(400).json({
          message: "Số lượng bán vượt quá tồn kho"
        });
      }

      const hanSuDung = new Date(loHang.HanSuDung);
      const homNay = new Date();
      homNay.setHours(0, 0, 0, 0);

      if (hanSuDung < homNay) {
        await transaction.rollback();
        return res.status(400).json({
          message: "Không thể bán lô đã hết hạn"
        });
      }
    }

    const invoiceResult = await new sql.Request(transaction)
      .input("NgayBan", sql.DateTime, ngayBan ? new Date(ngayBan) : new Date())
      .input("TongTien", sql.Decimal(18, 2), Number(tongTien))
      .input("TrangThai", sql.TinyInt, Number(trangThai))
      .input("MaTaiKhoan", sql.Int, Number(maTaiKhoan))
      .query(`
        INSERT INTO HoaDonBan (NgayBan, TongTien, TrangThai, MaTaiKhoan)
        OUTPUT INSERTED.MaHoaDonBan
        VALUES (@NgayBan, @TongTien, @TrangThai, @MaTaiKhoan)
      `);

    const maHoaDonBan = invoiceResult.recordset[0].MaHoaDonBan;

    for (const item of chiTiet) {
      await new sql.Request(transaction)
        .input("MaHoaDonBan", sql.Int, maHoaDonBan)
        .input("MaLoHang", sql.Int, Number(item.maLoHang))
        .input("SoLuong", sql.Int, Number(item.soLuong))
        .input("DonGia", sql.Decimal(18, 2), Number(item.donGia))
        .query(`
          INSERT INTO ChiTietBan (MaHoaDonBan, MaLoHang, SoLuong, DonGia)
          VALUES (@MaHoaDonBan, @MaLoHang, @SoLuong, @DonGia)
        `);

      if (Number(trangThai) === 2) {
        await new sql.Request(transaction)
          .input("MaLoHang", sql.Int, Number(item.maLoHang))
          .input("SoLuongBan", sql.Int, Number(item.soLuong))
          .query(`
            UPDATE LoHangNhap
            SET SoLuong = SoLuong - @SoLuongBan
            WHERE MaLoHang = @MaLoHang
          `);
      }
    }

    if (Number(trangThai) === 2 && phuongThuc) {
      await new sql.Request(transaction)
        .input("MaHoaDonBan", sql.Int, maHoaDonBan)
        .input("PhuongThuc", sql.NVarChar(50), phuongThuc)
        .input("KetQua", sql.TinyInt, 1)
        .input("ThoiGian", sql.DateTime, new Date())
        .query(`
          INSERT INTO ThanhToan (MaHoaDonBan, PhuongThuc, KetQua, ThoiGian)
          VALUES (@MaHoaDonBan, @PhuongThuc, @KetQua, @ThoiGian)
        `);
    }

    await transaction.commit();

    return res.status(201).json({
      message: "Tạo hóa đơn thành công",
      MaHoaDonBan: maHoaDonBan
    });
  } catch (error) {
    console.error("createInvoice error:", error);

    try {
      await transaction.rollback();
    } catch (rollbackError) {
      console.error("rollback error:", rollbackError);
    }

    return res.status(500).json({
      message: "Lỗi server khi tạo hóa đơn"
    });
  }
};

export const cancelInvoice = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const invoiceId = Number(id);

    if (!invoiceId) {
      return res.status(400).json({
        message: "Mã hóa đơn không hợp lệ"
      });
    }

    const checkResult = await pool
      .request()
      .input("id", sql.Int, invoiceId)
      .query(`
        SELECT MaHoaDonBan, TrangThai
        FROM HoaDonBan
        WHERE MaHoaDonBan = @id
      `);

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy hóa đơn"
      });
    }

    const invoice = checkResult.recordset[0];

    if (Number(invoice.TrangThai) === 3) {
      return res.status(400).json({
        message: "Hóa đơn đã bị hủy trước đó"
      });
    }

    if (Number(invoice.TrangThai) === 2) {
      return res.status(400).json({
        message: "Không thể hủy hóa đơn đã hoàn tất"
      });
    }

    await pool
      .request()
      .input("id", sql.Int, invoiceId)
      .input("TrangThai", sql.TinyInt, 3)
      .query(`
        UPDATE HoaDonBan
        SET TrangThai = @TrangThai
        WHERE MaHoaDonBan = @id
      `);

    return res.status(200).json({
      message: "Hủy hóa đơn thành công"
    });
  } catch (error) {
    console.error("cancelInvoice error:", error);
    return res.status(500).json({
      message: "Lỗi server khi hủy hóa đơn"
    });
  }
};

export const payInvoice = async (req: Request, res: Response) => {
  const transaction = new sql.Transaction(pool);

  try {
    const { id } = req.params;
    const { phuongThuc } = req.body;
    const invoiceId = Number(id);

    if (!invoiceId || !phuongThuc) {
      return res.status(400).json({
        message: "Dữ liệu thanh toán không hợp lệ"
      });
    }

    await transaction.begin();

    const invoiceResult = await new sql.Request(transaction)
      .input("id", sql.Int, invoiceId)
      .query(`
        SELECT MaHoaDonBan, TrangThai, TongTien
        FROM HoaDonBan
        WHERE MaHoaDonBan = @id
      `);

    if (invoiceResult.recordset.length === 0) {
      await transaction.rollback();
      return res.status(404).json({
        message: "Không tìm thấy hóa đơn"
      });
    }

    const invoice = invoiceResult.recordset[0];

    if (Number(invoice.TrangThai) !== 0) {
      await transaction.rollback();
      return res.status(400).json({
        message: "Chỉ có thể thanh toán hóa đơn nháp"
      });
    }

    if (Number(invoice.TongTien) <= 0) {
      await transaction.rollback();
      return res.status(400).json({
        message: "Không thể thanh toán hóa đơn có tổng tiền bằng 0"
      });
    }

    const detailResult = await new sql.Request(transaction)
      .input("id", sql.Int, invoiceId)
      .query(`
        SELECT MaLoHang, SoLuong
        FROM ChiTietBan
        WHERE MaHoaDonBan = @id
      `);

    if (detailResult.recordset.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        message: "Hóa đơn không có sản phẩm để thanh toán"
      });
    }

    for (const item of detailResult.recordset) {
      const stockCheck = await new sql.Request(transaction)
        .input("MaLoHang", sql.Int, Number(item.MaLoHang))
        .query(`
          SELECT SoLuong, HanSuDung
          FROM LoHangNhap
          WHERE MaLoHang = @MaLoHang
        `);

      if (stockCheck.recordset.length === 0) {
        await transaction.rollback();
        return res.status(400).json({
          message: "Lô hàng không tồn tại"
        });
      }

      const loHang = stockCheck.recordset[0];

      if (Number(loHang.SoLuong) < Number(item.SoLuong)) {
        await transaction.rollback();
        return res.status(400).json({
          message: "Số lượng bán vượt quá tồn kho"
        });
      }

      const hanSuDung = new Date(loHang.HanSuDung);
      const homNay = new Date();
      homNay.setHours(0, 0, 0, 0);

      if (hanSuDung < homNay) {
        await transaction.rollback();
        return res.status(400).json({
          message: "Không thể bán lô đã hết hạn"
        });
      }
    }

    for (const item of detailResult.recordset) {
      await new sql.Request(transaction)
        .input("MaLoHang", sql.Int, Number(item.MaLoHang))
        .input("SoLuongBan", sql.Int, Number(item.SoLuong))
        .query(`
          UPDATE LoHangNhap
          SET SoLuong = SoLuong - @SoLuongBan
          WHERE MaLoHang = @MaLoHang
        `);
    }

    await new sql.Request(transaction)
      .input("id", sql.Int, invoiceId)
      .input("TrangThai", sql.TinyInt, 2)
      .query(`
        UPDATE HoaDonBan
        SET TrangThai = @TrangThai
        WHERE MaHoaDonBan = @id
      `);

    await new sql.Request(transaction)
      .input("MaHoaDonBan", sql.Int, invoiceId)
      .input("PhuongThuc", sql.NVarChar(50), phuongThuc)
      .input("KetQua", sql.TinyInt, 1)
      .input("ThoiGian", sql.DateTime, new Date())
      .query(`
        INSERT INTO ThanhToan (MaHoaDonBan, PhuongThuc, KetQua, ThoiGian)
        VALUES (@MaHoaDonBan, @PhuongThuc, @KetQua, @ThoiGian)
      `);

    await transaction.commit();

    return res.status(200).json({
      message: "Thanh toán hóa đơn thành công"
    });
  } catch (error) {
    console.error("payInvoice error:", error);

    try {
      await transaction.rollback();
    } catch (rollbackError) {
      console.error("rollback error:", rollbackError);
    }

    return res.status(500).json({
      message: "Lỗi server khi thanh toán hóa đơn"
    });
  }
};
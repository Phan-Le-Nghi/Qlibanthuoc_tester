import { useEffect, useMemo, useState, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Sidebar from "../components/Sidebar";
import {
  getAvailableProductLots,
  createInvoice,
  AvailableProductLot
} from "../api/invoiceApi";
import "../styles/product.css";

interface SelectedInvoiceItem {
  tempId: number;
  maLoHang: number;
  maSanPham: number;
  tenSanPham: string;
  hamLuong: string;
  donViTinh: string;
  soLo: string;
  hanSuDung: string;
  soLuongTon: number;
  donGia: number;
  soLuong: string;
}

function NewInvoicePage() {
  const navigate = useNavigate();

  const [availableLots, setAvailableLots] = useState<AvailableProductLot[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [khachHang, setKhachHang] = useState<string>("Khách lẻ");
  const [phuongThuc, setPhuongThuc] = useState<string>("Tiền mặt");
  const [items, setItems] = useState<SelectedInvoiceItem[]>([]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await getAvailableProductLots();
      setAvailableLots(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      toast.error("Không tải được danh sách sản phẩm khả dụng");
      setAvailableLots([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const filteredLots = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    if (!keyword) return [];

    return availableLots.filter(
      (item) =>
        item.TenSanPham.toLowerCase().includes(keyword) ||
        item.HamLuong.toLowerCase().includes(keyword) ||
        item.SoLo.toLowerCase().includes(keyword)
    );
  }, [availableLots, searchTerm]);

  const addToInvoice = (lot: AvailableProductLot) => {
    const existed = items.find((item) => item.maLoHang === lot.MaLoHang);

    if (existed) {
      toast.info("Lô sản phẩm này đã có trong hóa đơn");
      return;
    }

    setItems((prev) => [
      ...prev,
      {
        tempId: Date.now(),
        maLoHang: lot.MaLoHang,
        maSanPham: lot.MaSanPham,
        tenSanPham: lot.TenSanPham,
        hamLuong: lot.HamLuong,
        donViTinh: lot.DonViTinh,
        soLo: lot.SoLo,
        hanSuDung: lot.HanSuDung,
        soLuongTon: lot.SoLuongTon,
        donGia: Number(lot.GiaBan),
        soLuong: "1"
      }
    ]);

    setSearchTerm("");
  };

  const handleQuantityChange = (tempId: number, value: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.tempId === tempId ? { ...item, soLuong: value } : item
      )
    );
  };

  const removeItem = (tempId: number) => {
    setItems((prev) => prev.filter((item) => item.tempId !== tempId));
  };

  const getThanhTien = (item: SelectedInvoiceItem) => {
    const soLuong = Number(item.soLuong) || 0;
    return soLuong * Number(item.donGia);
  };

  const tongSoMatHang = items.length;
  const tongSoLuong = items.reduce(
    (sum, item) => sum + (Number(item.soLuong) || 0),
    0
  );
  const tongTien = items.reduce((sum, item) => sum + getThanhTien(item), 0);

  const validateInvoice = () => {
    if (items.length === 0) {
      toast.error("Hóa đơn phải có ít nhất 1 sản phẩm");
      return false;
    }

    for (const item of items) {
      const soLuong = Number(item.soLuong);

      if (!soLuong || soLuong <= 0) {
        toast.error(`Số lượng của ${item.tenSanPham} phải lớn hơn 0`);
        return false;
      }

      if (soLuong > item.soLuongTon) {
        toast.error(`Số lượng của ${item.tenSanPham} vượt quá tồn kho`);
        return false;
      }
    }

    return true;
  };

  const submitInvoice = async (trangThai: number) => {
    if (!validateInvoice()) return;

    try {
      setSubmitting(true);

      const payload = {
        ngayBan: new Date().toISOString(),
        maTaiKhoan: Number(sessionStorage.getItem("maTaiKhoan")) || 1,
        khachHang: khachHang.trim() || "Khách lẻ",
        phuongThuc: trangThai === 2 ? phuongThuc : undefined,
        trangThai,
        tongTien,
        chiTiet: items.map((item) => ({
          maLoHang: item.maLoHang,
          soLuong: Number(item.soLuong),
          donGia: Number(item.donGia)
        }))
      };

      await createInvoice(payload);

      toast.success(
        trangThai === 2
          ? "Thanh toán thành công"
          : "Lưu nháp hóa đơn thành công"
      );

      navigate("/invoices");
    } catch (error) {
      console.error(error);
      toast.error("Không thể tạo hóa đơn");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("vi-VN");
  };

  return (
    <div className="layout">
      <Sidebar />

      <div className="content">
        <div className="page-card new-import-page">
          <div className="new-import-header">
            <button
              className="back-btn"
              type="button"
              onClick={() => navigate("/invoices")}
            >
              <ArrowLeft size={18} />
            </button>

            <div>
              <h2 className="page-title">Tạo hóa đơn bán hàng</h2>
              <p className="page-subtitle">Thêm sản phẩm và xử lý thanh toán</p>
            </div>
          </div>

          <div className="new-import-grid">
            <div className="new-import-left">
              <div className="section-card">
                <h3 className="section-title">Tìm sản phẩm</h3>

                <div className="search-wrap">
                  <Search className="search-icon" size={18} />
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Tìm sản phẩm theo tên hoặc số lô..."
                    value={searchTerm}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setSearchTerm(e.target.value)
                    }
                  />
                </div>

                {searchTerm.trim() && (
                  <div className="product-search-result">
                    {loading ? (
                      <p className="empty-text">Đang tải dữ liệu...</p>
                    ) : filteredLots.length === 0 ? (
                      <p className="empty-text">Không có sản phẩm khả dụng</p>
                    ) : (
                      filteredLots.map((lot) => (
                        <button
                          key={lot.MaLoHang}
                          type="button"
                          className="product-search-item"
                          onClick={() => addToInvoice(lot)}
                        >
                          <div>
                            <p className="product-name">{lot.TenSanPham}</p>
                            <span className="product-sub">
                              {lot.HamLuong} • Lô {lot.SoLo} • Tồn{" "}
                              {lot.SoLuongTon}
                            </span>
                          </div>
                          <Plus size={16} />
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="section-card">
                <h3 className="section-title">Danh sách sản phẩm</h3>

                {items.length === 0 ? (
                  <div className="empty-import-box">
                    Chưa có sản phẩm nào trong hóa đơn
                  </div>
                ) : (
                  <div className="import-item-list">
                    {items.map((item) => (
                      <div key={item.tempId} className="import-item-card">
                        <div className="import-item-header">
                          <div>
                            <p className="import-item-name">{item.tenSanPham}</p>
                            <span className="import-item-sub">
                              {item.hamLuong} • Lô {item.soLo} • HSD{" "}
                              {formatDate(item.hanSuDung)}
                            </span>
                          </div>

                          <button
                            type="button"
                            className="icon-btn danger"
                            onClick={() => removeItem(item.tempId)}
                            title="Xóa sản phẩm"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <div className="form-row">
                          <div className="form-group">
                            <label>Số lượng</label>
                            <input
                              type="number"
                              min="1"
                              max={item.soLuongTon}
                              value={item.soLuong}
                              onChange={(e) =>
                                handleQuantityChange(
                                  item.tempId,
                                  e.target.value
                                )
                              }
                            />
                            <small className="field-note">
                              Tồn khả dụng: {item.soLuongTon}
                            </small>
                          </div>

                          <div className="form-group">
                            <label>Đơn giá</label>
                            <input
                              type="number"
                              value={item.donGia}
                              disabled
                            />
                          </div>
                        </div>

                        <div className="import-item-total">
                          <span>Thành tiền</span>
                          <strong>
                            {getThanhTien(item).toLocaleString("vi-VN")} đ
                          </strong>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="new-import-right">
              <div className="section-card sticky-card">
                <h3 className="section-title">Thông tin khách hàng</h3>

                <div className="form-group">
                  <label>Tên khách hàng (tùy chọn)</label>
                  <input
                    type="text"
                    value={khachHang}
                    onChange={(e) => setKhachHang(e.target.value)}
                    placeholder="Khách lẻ"
                  />
                </div>

                <h3 className="section-title" style={{ marginTop: 20 }}>
                  Thanh toán
                </h3>

                <div className="submit-actions-column">
                  <button
                    type="button"
                    className={
                      phuongThuc === "Tiền mặt"
                        ? "btn-primary-full"
                        : "btn-secondary-full"
                    }
                    onClick={() => setPhuongThuc("Tiền mặt")}
                  >
                    Tiền mặt
                  </button>

                  <button
                    type="button"
                    className={
                      phuongThuc === "Chuyển khoản"
                        ? "btn-primary-full"
                        : "btn-secondary-full"
                    }
                    onClick={() => setPhuongThuc("Chuyển khoản")}
                  >
                    Chuyển khoản
                  </button>
                </div>

                <div className="summary-list" style={{ marginTop: 20 }}>
                  <div className="summary-row">
                    <span>Số mặt hàng</span>
                    <strong>{tongSoMatHang}</strong>
                  </div>

                  <div className="summary-row">
                    <span>Số lượng</span>
                    <strong>{tongSoLuong}</strong>
                  </div>
                </div>

                <div className="summary-total">
                  <span>Tổng tiền</span>
                  <strong>{tongTien.toLocaleString("vi-VN")} đ</strong>
                </div>

                <div className="submit-actions-column">
                  <button
                    type="button"
                    className="btn-primary-full"
                    disabled={submitting}
                    onClick={() => submitInvoice(2)}
                  >
                    {submitting ? "Đang xử lý..." : "Thanh toán"}
                  </button>

                  <button
                    type="button"
                    className="btn-secondary-full"
                    disabled={submitting}
                    onClick={() => submitInvoice(0)}
                  >
                    {submitting ? "Đang xử lý..." : "Lưu nháp"}
                  </button>
                </div>

                <div
                  style={{
                    marginTop: 16,
                    padding: "14px 16px",
                    borderRadius: 14,
                    background: "#eef4ff",
                    color: "#3157a5",
                    fontSize: 14,
                    lineHeight: 1.5
                  }}
                >
                  Lưu ý: Hóa đơn “Lưu nháp” chưa trừ tồn kho. Chỉ khi “Thanh
                  toán” thành công mới cập nhật số lượng tồn.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NewInvoicePage;
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, User, CreditCard, FileText } from "lucide-react";
import { toast } from "sonner";
import Sidebar from "../components/Sidebar";
import {
  getInvoiceById,
  cancelInvoice,
  payInvoice
} from "../api/invoiceApi";
import ConfirmDialog from "../components/ConfirmDialog";
import "../styles/product.css";

interface InvoiceDetailItem {
  MaCTBan: number;
  TenSanPham: string;
  HamLuong: string;
  SoLo: string;
  HanSuDung: string;
  SoLuong: number;
  DonGia: number;
  ThanhTien: number;
}

interface InvoiceGeneralInfo {
  MaHoaDonBan: number;
  NgayBan: string;
  TongTien: number;
  TrangThai: number;
  NguoiTao: string;
  PhuongThucThanhToan: string;
  KhachHang: string;
}

interface InvoiceDetailResponse {
  thongTinChung: InvoiceGeneralInfo;
  chiTiet: InvoiceDetailItem[];
}

function InvoiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const userRole = sessionStorage.getItem("vaiTro");
  const isAdmin = userRole === "Admin";
  const isStaff = userRole === "NhanVien";

  const [data, setData] = useState<InvoiceDetailResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [canceling, setCanceling] = useState<boolean>(false);
  const [paying, setPaying] = useState<boolean>(false);
  const [selectedMethod, setSelectedMethod] = useState<string>("Tiền mặt");
  const [openCancelDialog, setOpenCancelDialog] = useState<boolean>(false);

  const loadData = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const response = await getInvoiceById(Number(id));
      setData(response);

      if (
        response?.thongTinChung?.PhuongThucThanhToan &&
        response.thongTinChung.PhuongThucThanhToan !== "-"
      ) {
        setSelectedMethod(response.thongTinChung.PhuongThucThanhToan);
      }
    } catch (error) {
      console.error(error);
      toast.error("Không tải được chi tiết hóa đơn");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const thongTinChung = data?.thongTinChung;
  const chiTiet = data?.chiTiet ?? [];

  const canPay =
    (isAdmin || isStaff) && Number(thongTinChung?.TrangThai) === 0;

  const canCancel =
    isAdmin && Number(thongTinChung?.TrangThai) === 0;

  const tongTien = useMemo(() => {
    return chiTiet.reduce((sum, item) => sum + Number(item.ThanhTien ?? 0), 0);
  }, [chiTiet]);

  const formatDateTime = (value?: string) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString("vi-VN");
  };

  const formatDate = (value?: string) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("vi-VN");
  };

  const getStatusLabel = (status?: number) => {
    switch (Number(status)) {
      case 0:
        return "Nháp";
      case 2:
        return "Hoàn tất";
      case 3:
        return "Đã hủy";
      default:
        return "Không xác định";
    }
  };

  const getStatusClass = (status?: number) => {
    switch (Number(status)) {
      case 0:
        return "status-badge pending";
      case 2:
        return "status-badge active";
      case 3:
        return "status-badge inactive";
      default:
        return "status-badge";
    }
  };

  const handleCancelInvoice = async () => {
    if (!thongTinChung) return;

    try {
      setCanceling(true);
      await cancelInvoice(thongTinChung.MaHoaDonBan);
      toast.success("Đã hủy hóa đơn thành công");
      setOpenCancelDialog(false);
      await loadData();
    } catch (error) {
      console.error(error);
      toast.error("Không thể hủy hóa đơn");
    } finally {
      setCanceling(false);
    }
  };

  const handlePayInvoice = async () => {
    if (!thongTinChung) return;

    try {
      setPaying(true);
      await payInvoice(thongTinChung.MaHoaDonBan, selectedMethod);
      toast.success("Thanh toán hóa đơn thành công");
      await loadData();
    } catch (error) {
      console.error(error);
      toast.error("Không thể thanh toán hóa đơn");
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="layout">
      <Sidebar />

      <div className="content">
        <div className="page-card invoice-detail-page">
          <div className="invoice-detail-topbar">
            <div className="invoice-detail-title-wrap">
              <button
                type="button"
                className="back-btn"
                onClick={() => navigate("/invoices")}
              >
                <ArrowLeft size={18} />
              </button>

              <div>
                <h2 className="page-title">Chi tiết hóa đơn</h2>
                <p className="page-subtitle">
                  Mã hóa đơn:{" "}
                  {thongTinChung
                    ? `HD${String(thongTinChung.MaHoaDonBan).padStart(6, "0")}`
                    : "..."}
                </p>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              {canPay && (
                <button
                  type="button"
                  className="btn-primary-full"
                  style={{ width: "auto", padding: "10px 18px" }}
                  onClick={handlePayInvoice}
                  disabled={paying}
                >
                  {paying ? "Đang xử lý..." : "Thanh toán"}
                </button>
              )}

              {canCancel && (
                <button
                  type="button"
                  className="btn-danger-outline"
                  onClick={() => setOpenCancelDialog(true)}
                  disabled={canceling}
                >
                  {canceling ? "Đang xử lý..." : "Hủy hóa đơn"}
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="empty-import-box">Đang tải dữ liệu...</div>
          ) : !data ? (
            <div className="empty-import-box">Không tìm thấy hóa đơn</div>
          ) : (
            <div className="invoice-detail-grid">
              <div className="invoice-detail-left">
                <div className="section-card">
                  <h3 className="section-title">Danh sách sản phẩm</h3>

                  {chiTiet.length === 0 ? (
                    <div className="empty-import-box">Hóa đơn chưa có sản phẩm</div>
                  ) : (
                    <div className="invoice-product-list">
                      {chiTiet.map((item) => (
                        <div key={item.MaCTBan} className="invoice-product-card">
                          <div className="invoice-product-top">
                            <div>
                              <p className="invoice-product-name">{item.TenSanPham}</p>
                              <span className="invoice-product-sub">
                                {item.HamLuong}
                              </span>
                            </div>
                          </div>

                          <div className="invoice-product-meta">
                            <div className="invoice-meta-line">
                              <span>Lô:</span>
                              <strong>{item.SoLo}</strong>
                            </div>

                            <div className="invoice-meta-line">
                              <span>HSD:</span>
                              <strong>{formatDate(item.HanSuDung)}</strong>
                            </div>

                            <div className="invoice-meta-line">
                              <span>SL:</span>
                              <strong>{item.SoLuong}</strong>
                            </div>

                            <div className="invoice-meta-line">
                              <span>Đơn giá:</span>
                              <strong>
                                {Number(item.DonGia ?? 0).toLocaleString("vi-VN")} đ
                              </strong>
                            </div>
                          </div>

                          <div className="import-item-total">
                            <span>Thành tiền</span>
                            <strong>
                              {Number(item.ThanhTien ?? 0).toLocaleString("vi-VN")} đ
                            </strong>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="invoice-grand-total">
                    <span>Tổng cộng</span>
                    <strong>
                      {Number(thongTinChung?.TongTien ?? tongTien).toLocaleString("vi-VN")} đ
                    </strong>
                  </div>
                </div>
              </div>

              <div className="invoice-detail-right">
                <div className="section-card sticky-card">
                  <h3 className="section-title">Thông tin hóa đơn</h3>

                  {canPay && (
                    <div style={{ marginBottom: 16 }}>
                      <label
                        style={{
                          display: "block",
                          fontSize: "14px",
                          fontWeight: 600,
                          marginBottom: 10,
                          color: "#374151"
                        }}
                      >
                        Phương thức thanh toán
                      </label>

                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <button
                          type="button"
                          className={
                            selectedMethod === "Tiền mặt"
                              ? "btn-primary-full"
                              : "btn-secondary-full"
                          }
                          style={{ width: "auto", padding: "8px 14px" }}
                          onClick={() => setSelectedMethod("Tiền mặt")}
                        >
                          Tiền mặt
                        </button>

                        <button
                          type="button"
                          className={
                            selectedMethod === "Chuyển khoản"
                              ? "btn-primary-full"
                              : "btn-secondary-full"
                          }
                          style={{ width: "auto", padding: "8px 14px" }}
                          onClick={() => setSelectedMethod("Chuyển khoản")}
                        >
                          Chuyển khoản
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="invoice-info-list">
                    <div className="invoice-info-item">
                      <CalendarDays size={16} />
                      <div>
                        <span>Thời gian</span>
                        <strong>{formatDateTime(thongTinChung?.NgayBan)}</strong>
                      </div>
                    </div>

                    <div className="invoice-info-item">
                      <User size={16} />
                      <div>
                        <span>Khách hàng</span>
                        <strong>{thongTinChung?.KhachHang || "Khách lẻ"}</strong>
                      </div>
                    </div>

                    <div className="invoice-info-item">
                      <CreditCard size={16} />
                      <div>
                        <span>Thanh toán</span>
                        <strong>{thongTinChung?.PhuongThucThanhToan || "-"}</strong>
                      </div>
                    </div>

                    <div className="invoice-info-item">
                      <FileText size={16} />
                      <div>
                        <span>Người tạo</span>
                        <strong>{thongTinChung?.NguoiTao || "-"}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="invoice-status-box">
                    <span>Trạng thái</span>
                    <div className="invoice-status-badge-wrap">
                      <span className={getStatusClass(thongTinChung?.TrangThai)}>
                        {getStatusLabel(thongTinChung?.TrangThai)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={openCancelDialog}
        title="Xác nhận hủy hóa đơn"
        message="Bạn có chắc muốn hủy hóa đơn này không?"
        confirmText="Hủy hóa đơn"
        cancelText="Đóng"
        onConfirm={handleCancelInvoice}
        onCancel={() => setOpenCancelDialog(false)}
        loading={canceling}
        variant="danger"
      />
    </div>
  );
}

export default InvoiceDetailPage;
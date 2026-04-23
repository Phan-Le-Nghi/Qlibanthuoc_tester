import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, User, FileText, Package } from "lucide-react";
import { toast } from "sonner";
import Sidebar from "../components/Sidebar";
import {
  getImportById,
  completeImport,
  ImportDetailResponse
} from "../api/importApi";
import "../styles/product.css";

function ImportDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const userRole = localStorage.getItem("vaiTro");
  const isAdmin = userRole === "Admin";

  const [data, setData] = useState<ImportDetailResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [completing, setCompleting] = useState<boolean>(false);

  const loadData = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const response = await getImportById(Number(id));
      setData(response);
    } catch (error) {
      console.error(error);
      toast.error("Không tải được chi tiết phiếu nhập");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const thongTinChung = data?.thongTinChung;
  const chiTiet = data?.chiTiet ?? [];
  const canComplete = isAdmin && Number(thongTinChung?.TrangThai) === 0;

  const tongTien = useMemo(() => {
    return chiTiet.reduce((sum, item) => {
      return sum + Number(item.SoLuong ?? 0) * Number(item.GiaNhap ?? 0);
    }, 0);
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
    return Number(status) === 1 ? "Hoàn tất" : "Nháp";
  };

  const getStatusClass = (status?: number) => {
    return Number(status) === 1
      ? "status-badge active"
      : "status-badge pending";
  };

  const handleCompleteImport = async () => {
    if (!thongTinChung) return;

    try {
      setCompleting(true);
      await completeImport(thongTinChung.MaHoaDonNhap);
      toast.success("Hoàn tất phiếu nhập thành công");
      await loadData();
    } catch (error) {
      console.error(error);
      toast.error("Không thể hoàn tất phiếu nhập");
    } finally {
      setCompleting(false);
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
                onClick={() => navigate("/imports")}
              >
                <ArrowLeft size={18} />
              </button>

              <div>
                <h2 className="page-title">Chi tiết phiếu nhập</h2>
                <p className="page-subtitle">
                  Mã phiếu nhập:{" "}
                  {thongTinChung
                    ? `PN${String(thongTinChung.MaHoaDonNhap).padStart(3, "0")}`
                    : "..."}
                </p>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              {canComplete && (
                <button
                  type="button"
                  className="btn-primary-full"
                  style={{ width: "auto", padding: "10px 18px" }}
                  onClick={handleCompleteImport}
                  disabled={completing}
                >
                  {completing ? "Đang xử lý..." : "Hoàn tất phiếu nhập"}
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="empty-import-box">Đang tải dữ liệu...</div>
          ) : !data ? (
            <div className="empty-import-box">Không tìm thấy phiếu nhập</div>
          ) : (
            <div className="invoice-detail-grid">
              <div className="invoice-detail-left">
                <div className="section-card">
                  <h3 className="section-title">Danh sách sản phẩm nhập</h3>

                  {chiTiet.length === 0 ? (
                    <div className="empty-import-box">
                      Phiếu nhập chưa có sản phẩm
                    </div>
                  ) : (
                    <div className="invoice-product-list">
                      {chiTiet.map((item) => (
                        <div key={item.MaCTNhap} className="invoice-product-card">
                          <div className="invoice-product-top">
                            <div>
                              <p className="invoice-product-name">
                                {item.TenSanPham}
                              </p>
                              <span className="invoice-product-sub">
                                {item.HamLuong} • {item.DonViTinh}
                              </span>
                            </div>
                          </div>

                          <div className="invoice-product-meta">
                            <div className="invoice-meta-line">
                              <span>Lô:</span>
                              <strong>{item.SoLo || "-"}</strong>
                            </div>

                            <div className="invoice-meta-line">
                              <span>HSD:</span>
                              <strong>{formatDate(item.HanSuDung)}</strong>
                            </div>

                            <div className="invoice-meta-line">
                              <span>SL nhập:</span>
                              <strong>{item.SoLuong}</strong>
                            </div>

                            <div className="invoice-meta-line">
                              <span>Giá nhập:</span>
                              <strong>
                                {Number(item.GiaNhap ?? 0).toLocaleString("vi-VN")} đ
                              </strong>
                            </div>
                          </div>

                          <div className="import-item-total">
                            <span>Thành tiền</span>
                            <strong>
                              {(
                                Number(item.SoLuong ?? 0) *
                                Number(item.GiaNhap ?? 0)
                              ).toLocaleString("vi-VN")} đ
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
                  <h3 className="section-title">Thông tin phiếu nhập</h3>

                  <div className="invoice-info-list">
                    <div className="invoice-info-item">
                      <CalendarDays size={16} />
                      <div>
                        <span>Thời gian</span>
                        <strong>{formatDateTime(thongTinChung?.NgayNhap)}</strong>
                      </div>
                    </div>

                    <div className="invoice-info-item">
                      <User size={16} />
                      <div>
                        <span>Người tạo</span>
                        <strong>{thongTinChung?.NguoiTao || "-"}</strong>
                      </div>
                    </div>

                    <div className="invoice-info-item">
                      <Package size={16} />
                      <div>
                        <span>Số mặt hàng</span>
                        <strong>{chiTiet.length}</strong>
                      </div>
                    </div>

                    <div className="invoice-info-item">
                      <FileText size={16} />
                      <div>
                        <span>Tổng tiền</span>
                        <strong>
                          {Number(thongTinChung?.TongTien ?? tongTien).toLocaleString("vi-VN")} đ
                        </strong>
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
    </div>
  );
}

export default ImportDetailPage;
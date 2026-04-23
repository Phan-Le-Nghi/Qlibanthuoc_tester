import { useEffect, useMemo, useState, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Eye } from "lucide-react";
import { toast } from "sonner";
import Sidebar from "../components/Sidebar";
import { getAllInvoices } from "../api/invoiceApi";
import "../styles/product.css";

interface InvoiceItem {
  MaHoaDonBan: number;
  NgayBan: string;
  KhachHang: string;
  SoMatHang: number;
  TongTien: number;
  PhuongThucThanhToan: string | null;
  TrangThai: number;
}

type InvoiceStatusFilter = "Tất cả" | "Nháp" | "Hoàn tất" | "Đã hủy";

function InvoicesPage() {
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<InvoiceStatusFilter>("Tất cả");

  const loadData = async (): Promise<void> => {
    setLoading(true);
    try {
      const data = await getAllInvoices();
      setInvoices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      toast.error("Không tải được danh sách hóa đơn");
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatDateTime = (value?: string) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString("vi-VN");
  };

  const getStatusLabel = (status: number): string => {
    switch (status) {
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

  const getStatusClass = (status: number): string => {
    switch (status) {
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

  const filteredInvoices = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return invoices.filter((invoice) => {
      const maHoaDon = `HD${String(invoice.MaHoaDonBan).padStart(6, "0")}`.toLowerCase();
      const khachHang = String(invoice.KhachHang ?? "").toLowerCase();
      const statusText = getStatusLabel(invoice.TrangThai);

      const matchKeyword =
        !keyword ||
        maHoaDon.includes(keyword) ||
        khachHang.includes(keyword);

      const matchStatus =
        statusFilter === "Tất cả" || statusText === statusFilter;

      return matchKeyword && matchStatus;
    });
  }, [invoices, searchTerm, statusFilter]);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleCreateInvoice = () => {
    navigate("/invoices/new");
  };

  const handleViewDetail = (id: number) => {
    navigate(`/invoices/${id}`);
  };

  return (
    <div className="layout">
      <Sidebar />

      <div className="content">
        <div className="page-card">
          <div className="page-header">
            <div>
              <h2 className="page-title">Quản lý hóa đơn</h2>
              <p className="page-subtitle">{invoices.length} hóa đơn</p>
            </div>

            <button className="btn-add" onClick={handleCreateInvoice}>
              <Plus size={18} />
              Tạo hóa đơn
            </button>
          </div>

          <div className="toolbar">
            <div className="search-wrap">
              <Search className="search-icon" size={18} />
              <input
                type="text"
                className="search-input"
                placeholder="Tìm kiếm theo mã hóa đơn hoặc khách hàng..."
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>

            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as InvoiceStatusFilter)}
            >
              <option value="Tất cả">Tất cả trạng thái</option>
              <option value="Nháp">Nháp</option>
              <option value="Hoàn tất">Hoàn tất</option>
              <option value="Đã hủy">Đã hủy</option>
            </select>
          </div>

          <div className="table-wrap">
            <table className="table product-table">
              <thead>
                <tr>
                  <th>Mã hóa đơn</th>
                  <th>Thời gian</th>
                  <th>Khách hàng</th>
                  <th>Số mặt hàng</th>
                  <th>Tổng tiền</th>
                  <th>Thanh toán</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="empty-cell">
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="empty-cell">
                      Không tìm thấy hóa đơn phù hợp
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((invoice) => (
                    <tr key={invoice.MaHoaDonBan}>
                      <td className="td-code">
                        {`HD${String(invoice.MaHoaDonBan).padStart(6, "0")}`}
                      </td>
                      <td>{formatDateTime(invoice.NgayBan)}</td>
                      <td>{invoice.KhachHang || "Khách lẻ"}</td>
                      <td>{invoice.SoMatHang ?? 0}</td>
                      <td className="td-price">
                        {Number(invoice.TongTien ?? 0).toLocaleString("vi-VN")} đ
                      </td>
                      <td>{invoice.PhuongThucThanhToan || "-"}</td>
                      <td className="td-status">
                        <span className={getStatusClass(invoice.TrangThai)}>
                          {getStatusLabel(invoice.TrangThai)}
                        </span>
                      </td>
                      <td className="td-action">
                        <div className="action-buttons">
                          <button
                            className="icon-btn"
                            title="Xem chi tiết"
                            onClick={() => handleViewDetail(invoice.MaHoaDonBan)}
                          >
                            <Eye size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="table-footer">
            <p>
              Hiển thị <b>{filteredInvoices.length}</b> trên <b>{invoices.length}</b> hóa đơn
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InvoicesPage;
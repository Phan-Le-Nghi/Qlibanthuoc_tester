import { useEffect, useMemo, useState, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Eye } from "lucide-react";
import { toast } from "sonner";
import Sidebar from "../components/Sidebar";
import { getAllImports, ImportReceipt } from "../api/importApi";
import "../styles/product.css";

function ImportPage() {
  const navigate = useNavigate();

  const userRole = localStorage.getItem("vaiTro");
  const isAdmin = userRole === "Admin";
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [imports, setImports] = useState<ImportReceipt[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const loadData = async (): Promise<void> => {
    setLoading(true);
    try {
      const data = await getAllImports();
      setImports(data);
    } catch (error) {
      console.error(error);
      toast.error("Không tải được danh sách phiếu nhập");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredImports = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    if (!keyword) return imports;

    return imports.filter((item) => {
      const maPhieu = `PN${String(item.MaHoaDonNhap).padStart(3, "0")}`.toLowerCase();
      const nguoiTao = item.NguoiTao?.toLowerCase() || "";

      return maPhieu.includes(keyword) || nguoiTao.includes(keyword);
    });
  }, [imports, searchTerm]);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleCreateImport = () => {
    navigate("/imports/new");
  };

  const handleViewDetail = (id: number) => {
    navigate(`/imports/${id}`);
  };

  const formatDateTime = (value: string) => {
    const date = new Date(value);
    return date.toLocaleString("vi-VN");
  };

  const getStatusLabel = (status: number) => {
    return status === 1 ? "Hoàn tất" : "Nháp";
  };

  const getStatusClass = (status: number) => {
    return status === 1 ? "status-badge active" : "status-badge pending";
  };

  return (
    <div className="layout">
      <Sidebar />

      <div className="content">
        <div className="page-card">
          <div className="page-header">
            <div>
              <h2 className="page-title">Quản lý nhập hàng</h2>
              <p className="page-subtitle">{imports.length} phiếu nhập</p>
            </div>

            {isAdmin && (
              <button className="btn-add" onClick={handleCreateImport}>
                <Plus size={18} />
                Tạo phiếu nhập
              </button>
            )}
          </div>

          <div className="toolbar">
            <div className="search-wrap">
              <Search className="search-icon" size={18} />
              <input
                type="text"
                className="search-input"
                placeholder="Tìm kiếm theo mã phiếu hoặc người tạo..."
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
          </div>

          <div className="table-wrap">
            <table className="table product-table">
              <thead>
                <tr>
                  <th>Mã phiếu</th>
                  <th>Thời gian</th>
                  <th>Số mặt hàng</th>
                  <th>Tổng tiền</th>
                  <th>Người tạo</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="empty-cell">
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : filteredImports.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="empty-cell">
                      Không tìm thấy phiếu nhập phù hợp
                    </td>
                  </tr>
                ) : (
                  filteredImports.map((item) => (
                    <tr key={item.MaHoaDonNhap}>
                      <td className="td-code">
                        {`PN${String(item.MaHoaDonNhap).padStart(3, "0")}`}
                      </td>
                      <td>{formatDateTime(item.NgayNhap)}</td>
                      <td>{item.SoMatHang}</td>
                      <td className="td-price">
                        {Number(item.TongTien).toLocaleString("vi-VN")} đ
                      </td>
                      <td>{item.NguoiTao}</td>
                      <td className="td-status">
                        <span className={getStatusClass(item.TrangThai)}>
                          {getStatusLabel(item.TrangThai)}
                        </span>
                      </td>
                      <td className="td-action">
                        <div className="action-buttons">
                          <button
                            className="icon-btn"
                            title="Xem chi tiết"
                            onClick={() => handleViewDetail(item.MaHoaDonNhap)}
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
              Hiển thị <b>{filteredImports.length}</b> trên <b>{imports.length}</b> phiếu nhập
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ImportPage;
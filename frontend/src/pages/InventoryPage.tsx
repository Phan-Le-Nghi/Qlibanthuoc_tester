import { useEffect, useMemo, useState, ChangeEvent } from "react";
import { Search, Package, Boxes, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import Sidebar from "../components/Sidebar";
import { getInventory, InventoryItem } from "../api/inventoryApi";
import "../styles/product.css";

type FilterStatus = "Tất cả" | "Bình thường" | "Cận hạn" | "Hết hạn";

function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("Tất cả");

  const loadData = async (): Promise<void> => {
    setLoading(true);
    try {
      const data = await getInventory();
      setInventory(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      toast.error("Không tải được dữ liệu tồn kho");
      setInventory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const parseDateSafe = (value?: string) => {
    if (!value) return null;

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;

    date.setHours(0, 0, 0, 0);
    return date;
  };

  const getInventoryStatus = (hanSuDung?: string): Exclude<FilterStatus, "Tất cả"> => {
    const expiryDate = parseDateSafe(hanSuDung);
    if (!expiryDate) return "Hết hạn";

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "Hết hạn";
    if (diffDays <= 30) return "Cận hạn";
    return "Bình thường";
  };

  const filteredInventory = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return inventory.filter((item) => {
      const status = getInventoryStatus(item.HanSuDung);

      const matchKeyword =
        item.TenSanPham.toLowerCase().includes(keyword) ||
        item.SoLo.toLowerCase().includes(keyword);

      const matchStatus =
        statusFilter === "Tất cả" ? true : status === statusFilter;

      return matchKeyword && matchStatus;
    });
  }, [inventory, searchTerm, statusFilter]);

  const tongSoLo = inventory.length;

  const tongSoLuong = inventory.reduce(
    (sum, item) => sum + Number(item.SoLuong ?? 0),
    0
  );

  const soLoCanHan = inventory.filter(
    (item) => getInventoryStatus(item.HanSuDung) === "Cận hạn"
  ).length;

  const formatDate = (value?: string) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("vi-VN");
  };

  const getStatusClass = (status: string) => {
    if (status === "Bình thường") return "status-badge active";
    if (status === "Cận hạn") return "status-badge warning";
    return "status-badge inactive";
  };

  return (
    <div className="layout">
      <Sidebar />

      <div className="content">
        <div className="page-card">
          <div className="page-header">
            <div>
              <h2 className="page-title">Tồn kho</h2>
              <p className="page-subtitle">Quản lý tồn kho theo lô và hạn sử dụng</p>
            </div>
          </div>

          <div className="inventory-summary-grid">
            <div className="summary-card">
              <div className="summary-icon summary-blue">
                <Package size={20} />
              </div>
              <p className="summary-label">Tổng số lô</p>
              <h3 className="summary-value">{tongSoLo}</h3>
            </div>

            <div className="summary-card">
              <div className="summary-icon summary-green">
                <Boxes size={20} />
              </div>
              <p className="summary-label">Tổng số lượng</p>
              <h3 className="summary-value">{tongSoLuong.toLocaleString("vi-VN")}</h3>
            </div>

            <div className="summary-card">
              <div className="summary-icon summary-red">
                <AlertTriangle size={20} />
              </div>
              <p className="summary-label">Lô cận hạn</p>
              <h3 className="summary-value">{soLoCanHan}</h3>
            </div>
          </div>

          <div className="toolbar">
            <div className="search-wrap">
              <Search className="search-icon" size={18} />
              <input
                type="text"
                className="search-input"
                placeholder="Tìm kiếm theo tên sản phẩm hoặc số lô..."
                value={searchTerm}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setSearchTerm(e.target.value)
                }
              />
            </div>

            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
            >
              <option value="Tất cả">Tất cả trạng thái</option>
              <option value="Bình thường">Bình thường</option>
              <option value="Cận hạn">Cận hạn</option>
              <option value="Hết hạn">Hết hạn</option>
            </select>
          </div>

          <div className="table-wrap">
            <table className="table product-table">
              <thead>
                <tr>
                  <th>Tên sản phẩm</th>
                  <th>Số lô</th>
                  <th>Số lượng</th>
                  <th>Hạn sử dụng</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="empty-cell">
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : filteredInventory.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="empty-cell">
                      Không có dữ liệu tồn kho phù hợp
                    </td>
                  </tr>
                ) : (
                  filteredInventory.map((item) => {
                    const status = getInventoryStatus(item.HanSuDung);

                    return (
                      <tr
                        key={item.MaLoHang}
                        className={status === "Cận hạn" ? "row-warning" : ""}
                      >
                        <td className="td-name">
                          {item.TenSanPham}
                          <div className="sub-text">{item.HamLuong}</div>
                        </td>
                        <td>{item.SoLo}</td>
                        <td>{item.SoLuong}</td>
                        <td>{formatDate(item.HanSuDung)}</td>
                        <td className="td-status">
                          <span className={getStatusClass(status)}>
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="table-footer">
            <p>
              Hiển thị <b>{filteredInventory.length}</b> trên <b>{inventory.length}</b> lô hàng
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InventoryPage;
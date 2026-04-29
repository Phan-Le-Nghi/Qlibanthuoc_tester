import { useEffect, useState } from "react";
import {
  TrendingUp,
  Package,
  FileText,
  AlertTriangle,
  Activity,
  DollarSign
} from "lucide-react";
import { toast } from "sonner";
import Sidebar from "../components/Sidebar";
import {
  getDashboardSummary,
  DashboardSummary
} from "../api/dashboardApi";
import "../styles/product.css";

function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const result = await getDashboardSummary();
      setData(result);
    } catch (error) {
      console.error(error);
      toast.error("Không tải được dữ liệu tổng quan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const formatDateTime = (value?: string) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString("vi-VN");
  };

  const formatCurrency = (value?: number) => {
    return Number(value ?? 0).toLocaleString("vi-VN") + " đ";
  };

  const recentActivities = data?.hoatDongGanDay ?? [];

  const monthlyRevenue = data?.doanhThu ?? 0;

  const revenueChartData = data?.doanhThuTheoThang ?? [];
  const maxTrend = Math.max(
    ...revenueChartData.map((item) => Number(item.DoanhThu ?? 0)),
    1
  );

  const topProducts = data?.topSanPhamBanChay ?? [];

  return (
    <div className="layout">
      <Sidebar />

      <div className="content">
        <div className="page-card dashboard-page">
          <div className="page-header">
            <div>
              <h2 className="page-title">Tổng quan</h2>
              <p className="page-subtitle">Theo dõi hiệu quả kinh doanh</p>
            </div>
          </div>

          {loading ? (
            <div className="empty-import-box">Đang tải dữ liệu...</div>
          ) : (
            <>
              <div className="dashboard-kpi-grid">
                <div className="dashboard-kpi-card">
                  <div className="dashboard-kpi-top">
                    <div className="dashboard-kpi-icon green">
                      <DollarSign size={18} />
                    </div>
                    <span className="dashboard-kpi-trend positive">
                      <TrendingUp size={14} />
                      Hoạt động
                    </span>
                  </div>
                  <p className="dashboard-kpi-label">Doanh thu bán hàng</p>
                  <h3 className="dashboard-kpi-value">
                    {formatCurrency(monthlyRevenue)}
                  </h3>
                  <p className="dashboard-kpi-sub">Tổng từ hoạt động gần đây</p>
                </div>

                <div className="dashboard-kpi-card">
                  <div className="dashboard-kpi-top">
                    <div className="dashboard-kpi-icon blue">
                      <FileText size={18} />
                    </div>
                    <span className="dashboard-kpi-trend positive">
                      <TrendingUp size={14} />
                      Hệ thống
                    </span>
                  </div>
                  <p className="dashboard-kpi-label">Tổng số hóa đơn</p>
                  <h3 className="dashboard-kpi-value">{data?.tongHoaDon ?? 0}</h3>
                  <p className="dashboard-kpi-sub">Đã ghi nhận trong hệ thống</p>
                </div>

                <div className="dashboard-kpi-card">
                  <div className="dashboard-kpi-top">
                    <div className="dashboard-kpi-icon yellow">
                      <Package size={18} />
                    </div>
                    <span className="dashboard-kpi-trend neutral">Kho dữ liệu</span>
                  </div>
                  <p className="dashboard-kpi-label">Tổng sản phẩm</p>
                  <h3 className="dashboard-kpi-value">{data?.tongSanPham ?? 0}</h3>
                  <p className="dashboard-kpi-sub">Trong danh mục</p>
                </div>

                <div className="dashboard-kpi-card">
                  <div className="dashboard-kpi-top">
                    <div className="dashboard-kpi-icon red">
                      <AlertTriangle size={18} />
                    </div>
                    <span className="dashboard-kpi-trend negative">Cảnh báo</span>
                  </div>
                  <p className="dashboard-kpi-label">Sản phẩm cận hạn</p>
                  <h3 className="dashboard-kpi-value">{data?.soLoCanHan ?? 0}</h3>
                  <p className="dashboard-kpi-sub">Cần xử lý trong 30 ngày</p>
                </div>
              </div>

              <div className="dashboard-middle-grid">
                <div className="dashboard-panel">
                  <div className="dashboard-panel-header">
                    <div>
                      <h3 className="dashboard-panel-title">
                        Doanh thu 6 tháng gần nhất
                      </h3>
                      <p className="dashboard-panel-subtitle">
                        Dữ liệu từ hóa đơn đã thanh toán
                      </p>
                    </div>
                  </div>

                  <div className="fake-line-chart">
                    <div className="fake-line-grid">
                      {revenueChartData.length === 0 ? (
                        <div className="empty-import-box">Chưa có dữ liệu doanh thu theo tháng</div>
                      ) : (
                        revenueChartData.map((item, index) => {
                          const value = Number(item.DoanhThu ?? 0);
                          const heightPercent = (value / maxTrend) * 100;

                          return (
                            <div key={`${item.Nam}-${item.Thang}`} className="fake-line-point-wrap">
                              <div className="fake-line-column">
                                <div
                                  className="fake-line-dot"
                                  title={formatCurrency(value)}
                                  style={{ bottom: `${heightPercent}%` }}
                                />

                                {index < revenueChartData.length - 1 && (
                                  <div
                                    className="fake-line-segment"
                                    style={{ bottom: `${heightPercent}%` }}
                                  />
                                )}
                              </div>

                              <span className="fake-line-label">{item.Nhan}</span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                <div className="dashboard-panel">
                  <div className="dashboard-panel-header">
                    <div>
                      <h3 className="dashboard-panel-title">
                        Top sản phẩm bán chạy
                      </h3>
                      <p className="dashboard-panel-subtitle">
                        Dựa trên hóa đơn bán hàng hoàn tất
                      </p>
                    </div>
                  </div>

                  {topProducts.length === 0 ? (
                    <div className="empty-import-box">Chưa có dữ liệu bán hàng</div>
                  ) : (
                    <div className="dashboard-top-list">
                      {topProducts.map((item, index) => (
                        <div key={item.MaSanPham} className="dashboard-top-item">
                          <div className="dashboard-top-rank">{index + 1}</div>

                          <div className="dashboard-top-content">
                            <p className="dashboard-top-name">
                              {item.TenSanPham}
                              {item.HamLuong ? ` ${item.HamLuong}` : ""}
                            </p>
                            <span className="dashboard-top-sub">
                              {Number(item.TongSoLuongBan ?? 0).toLocaleString("vi-VN")} đã bán
                            </span>
                          </div>

                          <div className="dashboard-top-value">
                            {formatCurrency(item.TongDoanhThu)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
              </div>

              <div className="dashboard-panel">
                <div className="dashboard-panel-header">
                  <div>
                    <h3 className="dashboard-panel-title">Hoạt động gần đây</h3>
                    <p className="dashboard-panel-subtitle">
                      Cập nhật mới nhất từ hệ thống
                    </p>
                  </div>
                  <div className="dashboard-mini-badge">
                    <Activity size={14} />
                    Hôm nay
                  </div>
                </div>

                {recentActivities.length === 0 ? (
                  <div className="empty-import-box">Chưa có hoạt động nào</div>
                ) : (
                  <div className="recent-activity-list activity-scroll-box">
                    {recentActivities.slice(0, 10).map((item, index) => (
                      <div key={index} className="recent-activity-item">
                        <div className="recent-activity-left">
                          <p className="recent-activity-time">
                            {formatDateTime(item.ThoiGian)}
                          </p>
                          <p className="recent-activity-text">{item.NoiDung}</p>
                        </div>

                        <div className="recent-activity-value">
                          {formatCurrency(item.GiaTri)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
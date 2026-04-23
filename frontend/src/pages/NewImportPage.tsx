import { useEffect, useMemo, useState, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Sidebar from "../components/Sidebar";
import { getAllProducts, Product } from "../api/productApi";
import { createImport } from "../api/importApi";
import "../styles/product.css";

interface ProductOption {
  MaSanPham: number;
  TenSanPham: string;
  HamLuong: string;
  DonViTinh: string;
}

interface ImportItem {
  tempId: number;
  maSanPham: number;
  tenSanPham: string;
  hamLuong: string;
  donViTinh: string;
  soLuong: string;
  giaNhap: string;
  soLo: string;
  hanSuDung: string;
}

function NewImportPage() {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [items, setItems] = useState<ImportItem[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const loadProducts = async () => {
    try {
      setLoadingProducts(true);

      const data: Product[] = await getAllProducts();

      const activeProducts: ProductOption[] = (Array.isArray(data) ? data : [])
        .filter((item) => Number(item.TrangThai) === 1)
        .map((item) => ({
          MaSanPham: item.MaSanPham,
          TenSanPham: item.TenSanPham,
          HamLuong: item.HamLuong,
          DonViTinh: item.DonViTinh
        }));

      setProducts(activeProducts);
    } catch (error) {
      console.error(error);
      toast.error("Không tải được danh sách sản phẩm");
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    if (!keyword) return [];

    return products.filter(
      (product) =>
        product.TenSanPham.toLowerCase().includes(keyword) ||
        product.HamLuong.toLowerCase().includes(keyword) ||
        product.DonViTinh.toLowerCase().includes(keyword)
    );
  }, [searchTerm, products]);

  const addProductToImport = (product: ProductOption) => {
    const existed = items.find((item) => item.maSanPham === product.MaSanPham);

    if (existed) {
      toast.info("Sản phẩm này đã có trong phiếu nhập");
      return;
    }

    const newItem: ImportItem = {
      tempId: Date.now(),
      maSanPham: product.MaSanPham,
      tenSanPham: product.TenSanPham,
      hamLuong: product.HamLuong,
      donViTinh: product.DonViTinh,
      soLuong: "1",
      giaNhap: "",
      soLo: "",
      hanSuDung: ""
    };

    setItems((prev) => [...prev, newItem]);
    setSearchTerm("");
  };

  const removeItem = (tempId: number) => {
    setItems((prev) => prev.filter((item) => item.tempId !== tempId));
  };

  const updateItemField = (
    tempId: number,
    field: keyof ImportItem,
    value: string
  ) => {
    setItems((prev) =>
      prev.map((item) =>
        item.tempId === tempId ? { ...item, [field]: value } : item
      )
    );
  };

  const tongSoMatHang = items.length;
  const tongSoLuong = items.reduce(
    (sum, item) => sum + (Number(item.soLuong) || 0),
    0
  );
  const tongTien = items.reduce(
    (sum, item) =>
      sum + (Number(item.soLuong) || 0) * (Number(item.giaNhap) || 0),
    0
  );

  const validateItems = (): boolean => {
    if (items.length === 0) {
      toast.error("Phiếu nhập phải có ít nhất 1 sản phẩm");
      return false;
    }

    for (const item of items) {
      if (!item.soLuong || Number(item.soLuong) <= 0) {
        toast.error(`Số lượng của ${item.tenSanPham} phải lớn hơn 0`);
        return false;
      }

      if (!item.giaNhap || Number(item.giaNhap) <= 0) {
        toast.error(`Giá nhập của ${item.tenSanPham} phải lớn hơn 0`);
        return false;
      }

      if (!item.soLo.trim()) {
        toast.error(`Vui lòng nhập số lô cho ${item.tenSanPham}`);
        return false;
      }

      if (!item.hanSuDung) {
        toast.error(`Vui lòng nhập hạn sử dụng cho ${item.tenSanPham}`);
        return false;
      }
    }

    return true;
  };

  const handleSubmitImport = async (trangThai: number) => {
    if (!validateItems()) return;

    try {
      setSubmitting(true);

      const payload = {
        ngayNhap: new Date().toISOString(),
        trangThai,
        maTaiKhoan: Number(localStorage.getItem("maTaiKhoan")) || 1,
        tongTien,
        chiTiet: items.map((item) => ({
          maSanPham: item.maSanPham,
          soLuong: Number(item.soLuong),
          giaNhap: Number(item.giaNhap),
          soLo: item.soLo.trim(),
          hanSuDung: item.hanSuDung
        }))
      };

      await createImport(payload);

      toast.success(
        trangThai === 1
          ? "Tạo phiếu nhập hoàn tất thành công"
          : "Lưu nháp phiếu nhập thành công"
      );

      navigate("/imports");
    } catch (error) {
      console.error(error);
      toast.error("Không thể tạo phiếu nhập");
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString("vi-VN");
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
              onClick={() => navigate("/imports")}
            >
              <ArrowLeft size={18} />
            </button>

            <div>
              <h2 className="page-title">Tạo phiếu nhập hàng</h2>
              <p className="page-subtitle">
                Nhập thông tin sản phẩm, lô và hạn sử dụng
              </p>
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
                    placeholder="Tìm kiếm sản phẩm..."
                    value={searchTerm}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setSearchTerm(e.target.value)
                    }
                  />
                </div>

                {searchTerm.trim() && (
                  <div className="product-search-result">
                    {loadingProducts ? (
                      <p className="empty-text">Đang tải sản phẩm...</p>
                    ) : filteredProducts.length === 0 ? (
                      <p className="empty-text">Không tìm thấy sản phẩm</p>
                    ) : (
                      filteredProducts.map((product) => (
                        <button
                          key={product.MaSanPham}
                          type="button"
                          className="product-search-item"
                          onClick={() => addProductToImport(product)}
                        >
                          <div>
                            <p className="product-name">{product.TenSanPham}</p>
                            <span className="product-sub">
                              {product.HamLuong} • {product.DonViTinh}
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
                <h3 className="section-title">Danh sách sản phẩm nhập</h3>

                {items.length === 0 ? (
                  <div className="empty-import-box">
                    Chưa có sản phẩm nào trong phiếu nhập
                  </div>
                ) : (
                  <div className="import-item-list">
                    {items.map((item) => (
                      <div key={item.tempId} className="import-item-card">
                        <div className="import-item-header">
                          <div>
                            <p className="import-item-name">{item.tenSanPham}</p>
                            <span className="import-item-sub">
                              {item.hamLuong} • {item.donViTinh}
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
                              value={item.soLuong}
                              onChange={(e) =>
                                updateItemField(
                                  item.tempId,
                                  "soLuong",
                                  e.target.value
                                )
                              }
                            />
                          </div>

                          <div className="form-group">
                            <label>Giá nhập</label>
                            <input
                              type="number"
                              min="0"
                              value={item.giaNhap}
                              onChange={(e) =>
                                updateItemField(
                                  item.tempId,
                                  "giaNhap",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="form-group">
                            <label>Số lô</label>
                            <input
                              type="text"
                              value={item.soLo}
                              onChange={(e) =>
                                updateItemField(item.tempId, "soLo", e.target.value)
                              }
                              placeholder="Nhập số lô"
                            />
                          </div>

                          <div className="form-group">
                            <label>Hạn sử dụng</label>
                            <input
                              type="date"
                              value={item.hanSuDung}
                              onChange={(e) =>
                                updateItemField(
                                  item.tempId,
                                  "hanSuDung",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                        </div>

                        <div className="import-item-total">
                          <span>Thành tiền</span>
                          <strong>
                            {formatCurrency(
                              (Number(item.soLuong) || 0) *
                                (Number(item.giaNhap) || 0)
                            )}{" "}
                            đ
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
                <h3 className="section-title">Thông tin phiếu nhập</h3>

                <div className="summary-list" style={{ marginTop: 20 }}>
                  <div className="summary-row">
                    <span>Số mặt hàng</span>
                    <strong>{tongSoMatHang}</strong>
                  </div>

                  <div className="summary-row">
                    <span>Tổng số lượng</span>
                    <strong>{tongSoLuong}</strong>
                  </div>
                </div>

                <div className="summary-total">
                  <span>Tổng giá trị</span>
                  <strong>{formatCurrency(tongTien)} đ</strong>
                </div>

                <div className="submit-actions-column">
                  <button
                    type="button"
                    className="btn-primary-full"
                    disabled={submitting}
                    onClick={() => handleSubmitImport(1)}
                  >
                    {submitting ? "Đang xử lý..." : "Hoàn tất"}
                  </button>

                  <button
                    type="button"
                    className="btn-secondary-full"
                    disabled={submitting}
                    onClick={() => handleSubmitImport(0)}
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
                  Lưu ý: Phiếu “Lưu nháp” chưa cập nhật tồn kho. Chỉ phiếu
                  “Hoàn tất” mới cập nhật tồn kho theo lô.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NewImportPage;
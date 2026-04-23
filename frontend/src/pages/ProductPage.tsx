import { useEffect, useState, ChangeEvent } from "react";
import { Plus, Search, Edit, Trash2, Filter } from "lucide-react";
import { toast } from "sonner";
import Sidebar from "../components/Sidebar";
import ProductFormModal from "../components/ProductFormModal";
import "../styles/product.css";
import {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  Product
} from "../api/productApi";
import ConfirmDialog from "../components/ConfirmDialog";

interface ProductFormData {
  tenSanPham: string;
  hamLuong: string;
  donViTinh: string;
  giaBan: number;
  maNhom: number;
  trangThai: number;
}

function ProductPage() {
  const userRole = localStorage.getItem("vaiTro");
  const isAdmin = userRole === "Admin";
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false);
  const [deletingProductId, setDeletingProductId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  const loadData = async (): Promise<void> => {
    setLoading(true);
    try {
      const data = await getAllProducts();
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      toast.error("Không tải được danh sách sản phẩm");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredProducts = products.filter(
    (product) =>
      product.TenSanPham.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(product.MaSanPham).includes(searchTerm)
  );

  const handleAddProduct = async (data: ProductFormData) => {
    try {
      await createProduct({
        tenSanPham: data.tenSanPham,
        hamLuong: data.hamLuong,
        donViTinh: data.donViTinh,
        giaBan: data.giaBan,
        maNhom: data.maNhom,
        trangThai: data.trangThai
      });

      toast.success("Thêm sản phẩm thành công");
      setIsModalOpen(false);
      await loadData();
    } catch (error) {
      console.error(error);
      toast.error("Thêm sản phẩm thất bại");
    }
  };

  const handleUpdateProduct = async (data: ProductFormData) => {
    if (!editingProduct) return;

    try {
      await updateProduct(editingProduct.MaSanPham, {
        tenSanPham: data.tenSanPham,
        hamLuong: data.hamLuong,
        donViTinh: data.donViTinh,
        giaBan: data.giaBan,
        maNhom: data.maNhom,
        trangThai: data.trangThai
      });

      toast.success("Cập nhật sản phẩm thành công");
      setIsModalOpen(false);
      setEditingProduct(null);
      await loadData();
    } catch (error) {
      console.error(error);
      toast.error("Cập nhật sản phẩm thất bại");
    }
  };


  const openDeleteConfirm = (id: number) => {
    setDeletingProductId(id);
    setOpenDeleteDialog(true);
  };

  const handleDeleteProduct = async () => {
    if (!deletingProductId) return;

    try {
      setDeleting(true);
      await deleteProduct(deletingProductId);
      toast.success("Xóa sản phẩm thành công");
      setOpenDeleteDialog(false);
      setDeletingProductId(null);
      await loadData();
    } catch (error) {
      console.error(error);
      toast.error("Xóa sản phẩm thất bại");
    } finally {
      setDeleting(false);
    }
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className="layout">
      <Sidebar />

      <div className="content">
        <div className="page-card">
          <div className="page-header">
            <div>
              <h2 className="page-title">Quản lý sản phẩm</h2>
              <p className="page-subtitle">{products.length} sản phẩm</p>
            </div>

            {isAdmin && (
              <button onClick={openAddModal} className="btn-add">
                <Plus size={18} />
                Thêm sản phẩm
              </button>
            )}
          </div>

          <div className="toolbar">
            <div className="search-wrap">
              <Search className="search-icon" size={18} />
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm theo tên hoặc mã..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="search-input"
              />
            </div>

            <button
              className="btn-filter"
              onClick={() => toast.info("Chức năng lọc đang được phát triển")}
            >
              <Filter size={18} />
              <span>Lọc</span>
            </button>
          </div>

          <div className="table-wrap">
            <table className="table product-table">
              <thead>
                <tr>
                  <th>Mã SP</th>
                  <th>Tên sản phẩm</th>
                  <th>Danh mục</th>
                  <th>Đơn vị</th>
                  <th>Giá bán</th>
                  <th>Tồn kho</th>
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
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="empty-cell">
                      Không có sản phẩm phù hợp
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product.MaSanPham}>
                      <td className="td-code">
                        {`SP${String(product.MaSanPham).padStart(3, "0")}`}
                      </td>
                      <td className="td-name">{product.TenSanPham}</td>
                      <td className="td-category">{product.TenNhom}</td>
                      <td className="td-unit">{product.DonViTinh}</td>
                      <td className="td-price">
                        {Number(product.GiaBan ?? 0).toLocaleString("vi-VN")} đ
                      </td>
                      <td className="td-stock">{product.TonKho ?? 0}</td>
                      <td className="td-status">
                        <span
                          className={
                            product.TrangThai === 1
                              ? "status-badge active"
                              : "status-badge inactive"
                          }
                        >
                          {product.TrangThai === 1 ? "Hoạt động" : "Không hoạt động"}
                        </span>
                      </td>
                    <td className="td-action">
                      <div className="action-buttons">
                        {isAdmin && (
                          <>
                            <button
                              className="icon-btn"
                              onClick={() => openEditModal(product)}
                              title="Sửa"
                            >
                              <Edit size={16} />
                            </button>

                            <button
                              className="icon-btn danger"
                              onClick={() => openDeleteConfirm(product.MaSanPham)}
                              title="Xóa"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
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
              Hiển thị <b>{filteredProducts.length}</b> trên <b>{products.length}</b> sản phẩm
            </p>
          </div>
        </div>
      </div>

      <ProductFormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={editingProduct ? handleUpdateProduct : handleAddProduct}
        product={editingProduct}
      />

      <ConfirmDialog
        isOpen={openDeleteDialog}
        title="Xác nhận xóa sản phẩm"
        message="Bạn có chắc chắn muốn xóa sản phẩm này không?"
        confirmText="Xóa sản phẩm"
        cancelText="Đóng"
        onConfirm={handleDeleteProduct}
        onCancel={() => {
          setOpenDeleteDialog(false);
          setDeletingProductId(null);
        }}
        loading={deleting}
        variant="danger"
      />
    </div>
  );
}

export default ProductPage;
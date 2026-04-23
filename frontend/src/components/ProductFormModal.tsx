import { useEffect, useState, ChangeEvent, FormEvent } from "react";
import { Product } from "../api/productApi";

interface ProductFormData {
  tenSanPham: string;
  hamLuong: string;
  donViTinh: string;
  giaBan: string;
  maNhom: string;
  trangThai: string;
}

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    tenSanPham: string;
    hamLuong: string;
    donViTinh: string;
    giaBan: number;
    maNhom: number;
    trangThai: number;
  }) => void;
  product: Product | null;
}

const initialForm: ProductFormData = {
  tenSanPham: "",
  hamLuong: "",
  donViTinh: "",
  giaBan: "",
  maNhom: "1",
  trangThai: "1"
};

function ProductFormModal({ isOpen, onClose, onSubmit, product }: ProductFormModalProps) {
  const [formData, setFormData] = useState<ProductFormData>(initialForm);

  useEffect(() => {
    if (product) {
      setFormData({
        tenSanPham: product.TenSanPham,
        hamLuong: product.HamLuong,
        donViTinh: product.DonViTinh,
        giaBan: String(product.GiaBan),
        maNhom: String(product.MaNhom),
        trangThai: String(product.TrangThai)
      });
    } else {
      setFormData(initialForm);
    }
  }, [product, isOpen]);

  if (!isOpen) return null;

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    onSubmit({
      tenSanPham: formData.tenSanPham,
      hamLuong: formData.hamLuong,
      donViTinh: formData.donViTinh,
      giaBan: Number(formData.giaBan),
      maNhom: Number(formData.maNhom),
      trangThai: Number(formData.trangThai)
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-header">
          <h3>{product ? "Cập nhật sản phẩm" : "Thêm sản phẩm mới"}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Tên sản phẩm</label>
            <input
              name="tenSanPham"
              value={formData.tenSanPham}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Hàm lượng</label>
              <input
                name="hamLuong"
                value={formData.hamLuong}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Đơn vị tính</label>
              <input
                name="donViTinh"
                value={formData.donViTinh}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Giá bán</label>
              <input
                type="number"
                name="giaBan"
                value={formData.giaBan}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Nhóm thuốc</label>
              <select
                name="maNhom"
                value={formData.maNhom}
                onChange={handleChange}
              >
                <option value="1">Giảm đau</option>
                <option value="2">Kháng sinh</option>
                <option value="3">Tiêu hóa</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Trạng thái</label>
            <select
              name="trangThai"
              value={formData.trangThai}
              onChange={handleChange}
            >
              <option value="1">Hoạt động</option>
              <option value="0">Không hoạt động</option>
            </select>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="btn-save">
              {product ? "Cập nhật" : "Thêm mới"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProductFormModal;
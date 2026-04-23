import { useState, ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { loginApi } from "../api/authApi";

interface LoginForm {
  tenDangNhap: string;
  matKhau: string;
}

function LoginPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<LoginForm>({
    tenDangNhap: "",
    matKhau: ""
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.tenDangNhap || !formData.matKhau) {
      toast.error("Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu");
      return;
    }

    try {
      setLoading(true);

      const data = await loginApi(formData);

      localStorage.setItem("token", data.token);
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("username", data.user.TenDangNhap);
      localStorage.setItem("hoTen", data.user.HoTen || "");
      localStorage.setItem("vaiTro", data.user.VaiTro || "");
      localStorage.setItem("maTaiKhoan", String(data.user.MaTaiKhoan));
      localStorage.setItem("loginTime", new Date().toISOString());

      toast.success("Đăng nhập thành công");
      navigate("/");
    } catch (error: any) {
      console.error(error);
      toast.error(
        error?.response?.data?.message || "Đăng nhập thất bại"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-logo">💊</div>
          <div>
            <h1>Nhà thuốc 99</h1>
            <p>Hệ thống quản lý bán hàng</p>
          </div>
        </div>

        <div className="login-header">
          <h2>Đăng nhập</h2>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-group">
            <label>Tên đăng nhập</label>
            <input
              type="text"
              name="tenDangNhap"
              value={formData.tenDangNhap}
              onChange={handleChange}
              placeholder="Nhập tên đăng nhập"
            />
          </div>

          <div className="login-group">
            <label>Mật khẩu</label>
            <input
              type="password"
              name="matKhau"
              value={formData.matKhau}
              onChange={handleChange}
              placeholder="Nhập mật khẩu"
            />
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard,
  Package,
  Archive,
  FileText,
  LogOut,
  Pill,
  User,
  PackagePlus
} from "lucide-react";
import LogoutConfirmDialog from "./LogoutConfirmDialog";

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const hoTen = sessionStorage.getItem("hoTen") || "Admin";
  const vaiTro = sessionStorage.getItem("vaiTro") || "Quản trị viên";

  const navigation = [
    { name: "Tổng quan", href: "/", icon: LayoutDashboard },
    { name: "Sản phẩm", href: "/products", icon: Package },
    { name: "Nhập hàng", href: "/imports", icon: PackagePlus },
    { name: "Tồn kho", href: "/inventory", icon: Archive },
    { name: "Bán hàng", href: "/invoices", icon: FileText }
  ];

  const handleLogout = () => {
    setShowLogoutDialog(true);
  };

  const confirmLogout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("isAuthenticated");
    sessionStorage.removeItem("loginTime");
    sessionStorage.removeItem("username");
    sessionStorage.removeItem("hoTen");
    sessionStorage.removeItem("vaiTro");
    navigate("/login");
  };

  const cancelLogout = () => {
    setShowLogoutDialog(false);
  };

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="brand">
            <div className="brand-icon">
              <Pill size={22} color="white" />
            </div>

            <div className="brand-text">
              <h1>Nhà thuốc 99</h1>
              <p>Quản lý bán hàng</p>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.name}
                to={item.href}
                className={`nav-item ${active ? "active" : ""}`}
              >
                <Icon size={20} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="user-card">
            <div className="user-avatar">
              <User size={18} />
            </div>

            <div className="user-info">
              <p className="user-name">{hoTen}</p>
              <p className="user-role">{vaiTro}</p>
            </div>
          </div>

          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={20} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      <LogoutConfirmDialog
        isOpen={showLogoutDialog}
        onConfirm={confirmLogout}
        onCancel={cancelLogout}
      />
    </>
  );
}

export default Sidebar;
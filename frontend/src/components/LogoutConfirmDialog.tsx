interface LogoutConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function LogoutConfirmDialog({
  isOpen,
  onConfirm,
  onCancel
}: LogoutConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth: "420px" }}>
        <div className="modal-header">
          <h3>Xác nhận đăng xuất</h3>
          <button className="modal-close" onClick={onCancel}>
            ×
          </button>
        </div>

        <p style={{ margin: "0 0 20px 0", color: "#4b5563" }}>
          Bạn có chắc chắn muốn đăng xuất khỏi hệ thống không?
        </p>

        <div className="modal-actions">
          <button type="button" className="btn-cancel" onClick={onCancel}>
            Hủy
          </button>
          <button type="button" className="btn-save" onClick={onConfirm}>
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
}

export default LogoutConfirmDialog;
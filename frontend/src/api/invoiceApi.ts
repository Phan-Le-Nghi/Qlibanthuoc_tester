import axiosClient from "./axiosClient";

export interface InvoiceItem {
  MaHoaDonBan: number;
  NgayBan: string;
  KhachHang: string;
  SoMatHang: number;
  TongTien: number;
  PhuongThucThanhToan: string | null;
  TrangThai: number;
}

export interface InvoiceDetailItem {
  MaCTBan: number;
  TenSanPham: string;
  HamLuong: string;
  SoLo: string;
  HanSuDung: string;
  SoLuong: number;
  DonGia: number;
  ThanhTien: number;
}

export interface InvoiceGeneralInfo {
  MaHoaDonBan: number;
  NgayBan: string;
  TongTien: number;
  TrangThai: number;
  NguoiTao: string;
  PhuongThucThanhToan: string;
  KhachHang: string;
}

export interface InvoiceDetailResponse {
  thongTinChung: InvoiceGeneralInfo;
  chiTiet: InvoiceDetailItem[];
}

export interface AvailableProductLot {
  MaLoHang: number;
  MaSanPham: number;
  TenSanPham: string;
  HamLuong: string;
  DonViTinh: string;
  SoLo: string;
  HanSuDung: string;
  SoLuongTon: number;
  GiaBan: number;
}

export const getAllInvoices = async (): Promise<InvoiceItem[]> => {
  const response = await axiosClient.get("/invoices");
  return response.data;
};

export const getInvoiceById = async (id: number): Promise<InvoiceDetailResponse> => {
  const response = await axiosClient.get(`/invoices/${id}`);
  return response.data;
};

export const getAvailableProductLots = async (): Promise<AvailableProductLot[]> => {
  const response = await axiosClient.get("/invoices/available-products");
  return response.data;
};

export const createInvoice = async (payload: any) => {
  const response = await axiosClient.post("/invoices", payload);
  return response.data;
};

export const payInvoice = async (id: number, phuongThuc: string) => {
  const response = await axiosClient.put(`/invoices/${id}/pay`, {
    phuongThuc
  });
  return response.data;
};

export const cancelInvoice = async (id: number) => {
  const response = await axiosClient.put(`/invoices/${id}/cancel`);
  return response.data;
};
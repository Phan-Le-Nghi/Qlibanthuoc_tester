import axiosClient from "./axiosClient";

export interface ImportReceipt {
  MaHoaDonNhap: number;
  NgayNhap: string;
  TongTien: number;
  TrangThai: number;
  NguoiTao: string;
  SoMatHang: number;
}

export interface CreateImportDetailPayload {
  maSanPham: number;
  soLuong: number;
  giaNhap: number;
  soLo: string;
  hanSuDung: string;
}

export interface CreateImportPayload {
  ngayNhap: string;
  ghiChu?: string;
  trangThai: number;
  maTaiKhoan: number;
  tongTien: number;
  chiTiet: CreateImportDetailPayload[];
}

export interface ImportDetailItem {
  MaCTNhap: number;
  TenSanPham: string;
  HamLuong: string;
  DonViTinh: string;
  SoLuong: number;
  GiaNhap: number;
  SoLo: string;
  HanSuDung: string;
  SoLuongLo: number;
}

export interface ImportGeneralInfo {
  MaHoaDonNhap: number;
  NgayNhap: string;
  TongTien: number;
  TrangThai: number;
  NguoiTao: string;
}

export interface ImportDetailResponse {
  thongTinChung: ImportGeneralInfo;
  chiTiet: ImportDetailItem[];
}

export const getAllImports = async (): Promise<ImportReceipt[]> => {
  const response = await axiosClient.get("/imports");
  return response.data;
};

export const getImportById = async (id: number): Promise<ImportDetailResponse> => {
  const response = await axiosClient.get(`/imports/${id}`);
  return response.data;
};

export const createImport = async (payload: CreateImportPayload) => {
  const response = await axiosClient.post("/imports", payload);
  return response.data;
};

export const completeImport = async (id: number) => {
  const response = await axiosClient.put(`/imports/${id}/complete`);
  return response.data;
};
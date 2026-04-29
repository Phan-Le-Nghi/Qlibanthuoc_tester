import axiosClient from "./axiosClient";

export interface DashboardActivityItem {
  ThoiGian: string;
  Loai: "BAN" | "NHAP";
  NoiDung: string;
  GiaTri: number;
}

export interface TopSanPhamBanChayItem {
  MaSanPham: number;
  TenSanPham: string;
  HamLuong: string;
  TongSoLuongBan: number;
  TongDoanhThu: number;
}

export interface DashboardSummary {
  tongSanPham: number;
  tongHoaDon: number;
  soLoCanHan: number;
  doanhThu: number;
  chiPhiNhap: number;
  loiNhuanTamTinh: number;
  doanhThuTheoThang: {
    Nam: number;
    Thang: number;
    Nhan: string;
    DoanhThu: number;
  }[];
  hoatDongGanDay: DashboardActivityItem[];
  topSanPhamBanChay: TopSanPhamBanChayItem[];
}

export const getDashboardSummary = async (): Promise<DashboardSummary> => {
  const response = await axiosClient.get("/dashboard");
  return response.data;
};
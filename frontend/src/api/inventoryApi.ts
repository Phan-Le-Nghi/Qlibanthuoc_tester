import axiosClient from "./axiosClient";

export interface InventoryItem {
  MaLoHang: number;
  MaSanPham: number;
  TenSanPham: string;
  HamLuong: string;
  SoLo: string;
  SoLuong: number;
  HanSuDung: string;
  
}

export const getInventory = async (): Promise<InventoryItem[]> => {
  const response = await axiosClient.get("/inventory");
  return response.data;
};
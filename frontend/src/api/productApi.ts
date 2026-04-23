import axiosClient from "./axiosClient";

export interface Product {
  MaSanPham: number;
  TenSanPham: string;
  HamLuong: string;
  DonViTinh: string;
  GiaBan: number;
  TrangThai: number;
  MaNhom: number;
  TenNhom: string;
  TonKho: number;
}

export interface ProductPayload {
  tenSanPham: string;
  hamLuong: string;
  donViTinh: string;
  giaBan: number;
  maNhom: number;
  trangThai: number;
}

export const getAllProducts = async (): Promise<Product[]> => {
  const response = await axiosClient.get("/products");
  return response.data;
};

export const createProduct = async (payload: ProductPayload) => {
  const response = await axiosClient.post("/products", payload);
  return response.data;
};

export const updateProduct = async (id: number, payload: ProductPayload) => {
  const response = await axiosClient.put(`/products/${id}`, payload);
  return response.data;
};

export const deleteProduct = async (id: number) => {
  const response = await axiosClient.delete(`/products/${id}`);
  return response.data;
};
import axiosClient from "./axiosClient";

export interface LoginPayload {
  tenDangNhap: string;
  matKhau: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: {
    MaTaiKhoan: number;
    TenDangNhap: string;
    HoTen: string;
    VaiTro: string;
  };
}

export const loginApi = async (data: LoginPayload) => {
  const res = await axiosClient.post("/auth/login", data);
  return res.data;
};
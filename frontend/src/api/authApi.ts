import axios from "axios";

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

const BASE_URL = "http://localhost:3001/api/auth";

export const loginApi = async (data: LoginPayload): Promise<LoginResponse> => {
  const res = await axios.post<LoginResponse>(`${BASE_URL}/login`, data);
  return res.data;
};
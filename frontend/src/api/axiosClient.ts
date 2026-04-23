import axios from "axios";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL
});

axiosClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default axiosClient;
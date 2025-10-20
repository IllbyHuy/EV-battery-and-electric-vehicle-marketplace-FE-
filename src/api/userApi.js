import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE || "https://localhost:7137";
const api = axios.create({ baseURL });

// helper: set/remove Authorization header cho tất cả request
export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
}

// nếu đã có token trong localStorage khi load app, set header luôn
const _storedToken = localStorage.getItem("token");
if (_storedToken) setAuthToken(_storedToken);

export const getProfile = async () => {
  const { data } = await api.get("/api/demo");
  return data;
};

export const userRegister = async (payload) => {
  const { data } = await api.post("/api/Auth/register", payload);
  return data;
};
export const registerOtp = async (payload) => {
  const { data } = await api.post("/api/Auth/verify-otp", payload);
  return data;
};
export const userLogin = async (payload) => {
  const { data } = await api.post("/api/Auth/login", payload);
  return data;
};


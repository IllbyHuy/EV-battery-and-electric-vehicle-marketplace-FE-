import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE || "https://localhost:7137";
export const api = axios.create({ baseURL });

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

export const getUser = async () => {
  const { data } = await api.get("/api/User/GetUser");
  return data;
};

export const updateUser = async (payload) => {
  const { data } = await api.put("/api/User/UpdateUser", payload);
  return data;
};

export const sendOtpChangeEmail = async (payload) => {
  const { data } = await api.post("/api/User/SendOtpChangeEmail", payload);
  return data;
};

export const changeEmail = async (payload) => {
  const { data } = await api.put("/api/User/ChangeEmail", payload);
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

// Admin Battery APIs
export const getAllBatteries = async () => {
  const { data } = await api.get("/api/Battery/admin/all");
  return data;
};

export const approveBattery = async (batteryId) => {
  const { data } = await api.put(`/api/Battery/approve/${batteryId}`);
  return data;
};

export const createBattery = async (batteryData) => {
  // Request body should be an array: [{ brand, model, capacity, voltage }]
  const { data } = await api.post("/api/Battery/Create", [batteryData]);
  return data;
};

export const deleteBattery = async (batteryId) => {
  const { data } = await api.delete(`/api/Battery/delete/${batteryId}`);
  return data;
};

export const updateBattery = async (batteryId, batteryData) => {
  // Request body: { brand, model, capacity, voltage }
  const { data } = await api.put(`/api/Battery/update/${batteryId}`, batteryData);
  return data;
};

export const getBatteryPriceSuggestion = async (batteryData) => {
  const { data } = await api.post("/Battery_Price_Suggestion", batteryData);
  return data;
};

// Admin Vehicle APIs
export const getAllVehicles = async () => {
  const { data } = await api.get("/api/Vehicle/AdminGetAll");
  return data;
};

export const createVehicle = async (vehicleData) => {
  // Request body should be an array: [{ brand, model, startYear, endYear, compatibleBatteryIds }]
  const { data } = await api.post("/api/Vehicle/Create", [vehicleData]);
  return data;
};

export const approveVehicle = async (vehicleId) => {
  const { data } = await api.put(`/api/Vehicle/Approve/${vehicleId}`);
  return data;
};

export const updateVehicle = async (vehicleId, vehicleData) => {
  // Request body: { brand, model, startYear, endYear, compatibleBatteryIds }
  const { data } = await api.put(`/api/Vehicle/Update/${vehicleId}`, vehicleData);
  return data;
};

export const deleteVehicle = async (vehicleId) => {
  const { data } = await api.delete(`/api/Vehicle/Delete/${vehicleId}`);
  return data;
};


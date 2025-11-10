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
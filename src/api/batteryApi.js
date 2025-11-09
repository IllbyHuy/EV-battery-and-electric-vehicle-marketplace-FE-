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
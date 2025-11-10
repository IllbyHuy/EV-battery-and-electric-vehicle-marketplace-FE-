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

// Listing APIs
export const getAllListings = async () => {
  const { data } = await api.get("/api/Listing/all");
  return data;
};

export const getListingById = async (listingId) => {
  // endpoint: GET /api/Listing/GetByListingById
  // using query param listingId
  const { data } = await api.get("/api/Listing/GetByListingById", {
    params: { listingId },
  });
  return data;
};

export const createListing = async (listingData) => {
  // POST /api/Listing/create
  const { data } = await api.post("/api/Listing/create", listingData);
  return data;
};

export const updateListing = async (listingId, listingData) => {
  // PUT /api/Listing/update/{listingId}
  const { data } = await api.put(`/api/Listing/update/${listingId}`, listingData);
  return data;
};

export const deleteListing = async (listingId) => {
  // DELETE /api/Listing/delete/{listingId}
  const { data } = await api.delete(`/api/Listing/delete/${listingId}`);
  return data;
};

// Get listing details by id
export const getListingDetails = async (listingId) => {
  try {
    const { data } = await api.get(`/api/Listing/GetByListingById/${listingId}`);
    return data;
  } catch (err) {
    console.error("Failed to fetch listing details:", err);
    throw err;
  }
};

// Battery detail by id
export const getBatteryById = async (batteryId) => {
  try {
    const { data } = await api.get(`/api/Battery/GetById/${batteryId}`);
    return data;
  } catch (err) {
    console.error("Failed to fetch battery:", err);
    return null;
  }
};

// Vehicle detail by id
export const getVehicleById = async (vehicleId) => {
  try {
    const { data } = await api.get(`/api/Vehicle/GetById/${vehicleId}`);
    return data;
  } catch (err) {
    console.error("Failed to fetch vehicle:", err);
    return null;
  }
};

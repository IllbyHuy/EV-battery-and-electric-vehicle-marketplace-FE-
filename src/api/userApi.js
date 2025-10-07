import axios from "axios";

const api = axios.create({ baseURL: "/api" });

export const getProfile = async () => {
  const { data } = await api.get("/demo");
  return data;
};



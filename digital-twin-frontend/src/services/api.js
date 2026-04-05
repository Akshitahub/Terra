import axios from "axios";

// Uses env variable in production (GCP Cloud Run URL)
// Falls back to localhost for local development
const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

export const getEnergyData = async (building = null) => {
  const params = building && building !== "All" ? { building } : {};
  const res = await api.get("/energy", { params });
  return res.data;
};

export const getAnomalies = async () => {
  const res = await api.get("/anomalies");
  return res.data;
};

export const getStats = async () => {
  const res = await api.get("/stats");
  return res.data;
};

export const predictEnergy = async (inputData) => {
  const res = await api.post("/predict", inputData);
  return res.data;
};

export const explainPrediction = async (inputData) => {
  const res = await api.post("/explain", inputData);
  return res.data;
};

export const getBuildings = async () => {
  const res = await api.get("/buildings");
  return res.data;
};

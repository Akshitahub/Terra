import axios from "axios";

const BASE_URL = "http://localhost:5000";

export const getEnergyData = async () => {
  const res = await axios.get(`${BASE_URL}/energy`);
  return res.data;
};

export const getAnomalies = async () => {
  const res = await axios.get(`${BASE_URL}/anomalies`);
  return res.data;
};

export const getStats = async () => {
  const res = await axios.get(`${BASE_URL}/stats`);
  return res.data;
};

export const predictEnergy = async (inputData) => {
  const res = await axios.post(`${BASE_URL}/predict`, inputData, {
    timeout: 10000
  });
  return res.data;
};

export const explainPrediction = async (inputData) => {
  const res = await axios.post(`${BASE_URL}/explain`, inputData, {
    timeout: 15000
  });
  return res.data;
};

export const getBuildings = async () => {
  const res = await axios.get(`${BASE_URL}/buildings`);
  return res.data;
};